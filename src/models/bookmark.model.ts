export default interface IBookmark {
    id: string; // Unique identifier for the bookmark
    name: string; // Name of the bookmark
    sessionId: string; // session ID if the bookmark is associated with a specific session
    path: string; // Path to the bookmarked file or directory
    createdAt: Date; // Timestamp when the bookmark was created
    updatedAt: Date; // Timestamp when the bookmark was last updated
    icon?: string; // Optional icon for the bookmark
    color?: string; // Optional color for the bookmark
    description?: string; // Optional description for the bookmark
}