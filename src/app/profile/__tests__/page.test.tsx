import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProfilePage from "../page";
import {
  fetchProfile,
  updateProfile,
  ProfileApiError,
} from "@/lib/profile.client";

const mockReplace = jest.fn();
const mockRouter = { replace: mockReplace };
jest.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

jest.mock("@/lib/profile.client", () => ({
  fetchProfile: jest.fn(),
  updateProfile: jest.fn(),
  ProfileApiError: class ProfileApiError extends Error {
    constructor(
      message: string,
      readonly status: number,
      readonly code?: string,
      readonly details: { field: string; message: string }[] = [],
    ) {
      super(message);
    }
  },
}));

const profile = {
  userId: "8c0c0b42-ff2a-4d68-b90f-3b845ca8106a",
  displayName: "Ada",
  bio: "Engineer",
  avatarUrl: null,
  preferences: { theme: "dark", custom: "keep me" },
  socialLinks: { website: "https://example.test" },
  createdAt: "2026-10-18T12:00:00Z",
  updatedAt: "2026-10-18T12:00:00Z",
};

describe("ProfilePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetchProfile as jest.Mock).mockResolvedValue(profile);
  });

  it("shows the profile and enters edit mode", async () => {
    const user = userEvent.setup();
    render(<ProfilePage />);

    expect(await screen.findByRole("heading", { name: "Ada" })).toBeInTheDocument();
    expect(screen.getByText("keep me")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit profile" }));
    expect(screen.getByLabelText("Display name")).toHaveValue("Ada");
    expect(screen.getByLabelText("Preferences (JSON object)")).toHaveValue(
      JSON.stringify(profile.preferences, null, 2),
    );
  });

  it("sends all fields and updates the displayed profile after saving", async () => {
    const user = userEvent.setup();
    (updateProfile as jest.Mock).mockResolvedValue({
      ...profile,
      displayName: "Ada Lovelace",
    });
    render(<ProfilePage />);

    await user.click(await screen.findByRole("button", { name: "Edit profile" }));
    await user.clear(screen.getByLabelText("Display name"));
    await user.type(screen.getByLabelText("Display name"), "Ada Lovelace");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalledWith({
        displayName: "Ada Lovelace",
        bio: "Engineer",
        avatarUrl: null,
        preferences: profile.preferences,
        socialLinks: profile.socialLinks,
      });
    });
    expect(await screen.findByRole("heading", { name: "Ada Lovelace" })).toBeInTheDocument();
  });

  it("shows local JSON validation feedback without submitting", async () => {
    const user = userEvent.setup();
    render(<ProfilePage />);
    await user.click(await screen.findByRole("button", { name: "Edit profile" }));
    fireEvent.change(screen.getByLabelText("Preferences (JSON object)"), {
      target: { value: "[]" },
    });
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Preferences must be a JSON object.")).toBeInTheDocument();
    expect(updateProfile).not.toHaveBeenCalled();
  });

  it("shows provisioning guidance for a missing profile", async () => {
    (fetchProfile as jest.Mock).mockRejectedValue(
      new ProfileApiError("not found", 404),
    );
    render(<ProfilePage />);

    expect(await screen.findByRole("heading", { name: "Profile not available" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("associates service validation details with editable fields", async () => {
    const user = userEvent.setup();
    (updateProfile as jest.Mock).mockRejectedValue(
      new ProfileApiError("invalid update", 400, "invalid_update", [
        { field: "displayName", message: "must be at most 100 characters" },
      ]),
    );
    render(<ProfilePage />);

    await user.click(await screen.findByRole("button", { name: "Edit profile" }));
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("must be at most 100 characters")).toBeInTheDocument();
    expect(screen.getByLabelText("Display name")).toHaveAttribute("aria-invalid", "true");
  });

  it("redirects to sign in when the profile request is unauthorized", async () => {
    (fetchProfile as jest.Mock).mockRejectedValue(
      new ProfileApiError("unauthorized", 401),
    );
    render(<ProfilePage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/login?callbackUrl=%2Fprofile");
    });
  });
});
