import { render, screen } from "@testing-library/react";
import BlogAuthor from "../BlogAuthor";

const profile = {
  userId: "8c0c0b42-ff2a-4d68-b90f-3b845ca8106a",
  displayName: "Ada",
  bio: "Engineer",
  avatarUrl: null,
  createdAt: "2026-10-18T12:00:00Z",
};

describe("BlogAuthor", () => {
  it("renders the embedded author profile when its ID matches the author UUID", () => {
    render(<BlogAuthor profile={profile} authorUuid={profile.userId} />);

    expect(screen.getByText("Ada")).toBeInTheDocument();
    expect(screen.getByText("Engineer")).toBeInTheDocument();
  });

  it("renders a neutral fallback when the embedded profile does not match its author UUID", () => {
    render(<BlogAuthor profile={profile} authorUuid="different-uuid" />);

    expect(screen.getByText("Author unavailable")).toBeInTheDocument();
    expect(screen.queryByText("Engineer")).not.toBeInTheDocument();
  });

  it("renders a safe HTTPS avatar for a verified author", () => {
    render(
      <BlogAuthor
        profile={{ ...profile, avatarUrl: "https://images.example.test/ada.png" }}
        authorUuid={profile.userId}
      />,
    );

    expect(document.querySelector("img")).toHaveAttribute(
      "src",
      "https://images.example.test/ada.png",
    );
    expect(document.querySelector("img")).toHaveAttribute("referrerPolicy", "no-referrer");
  });

  it.each([
    "http://images.example.test/ada.png",
    "javascript:alert(1)",
    "https://user:password@images.example.test/ada.png",
    "not a URL",
  ])("rejects unsafe avatar URL %s and uses the name initial", (avatarUrl) => {
    render(
      <BlogAuthor
        profile={{ ...profile, avatarUrl }}
        authorUuid={profile.userId}
      />,
    );

    expect(document.querySelector("img")).not.toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("uses a fallback when a verified author's display name is blank", () => {
    render(
      <BlogAuthor
        profile={{ ...profile, displayName: "  ", bio: null }}
        authorUuid={profile.userId}
      />,
    );

    expect(screen.getByText("Author unavailable")).toBeInTheDocument();
    expect(screen.queryByText("Engineer")).not.toBeInTheDocument();
  });
});
