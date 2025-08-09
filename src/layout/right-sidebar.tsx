export default function RightSidebar() {
    return (
        <aside className="w-64 border-l bg-background p-4 flex flex-col">
            <h2 className="font-semibold mb-4">Details</h2>
            <div className="flex-1">
                {/* Add your sidebar content here */}
                <div className="text-muted-foreground">No file selected</div>
            </div>
        </aside>
    );
}