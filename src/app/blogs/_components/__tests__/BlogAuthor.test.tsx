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
});
