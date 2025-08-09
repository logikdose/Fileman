import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ISession from "@/models/session.model";
import useSessionStore from "@/stores/session.store";
import { Key, KeyIcon, Lock, Server } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { open } from "@tauri-apps/plugin-dialog";

type Props = {
    dialogOpen: boolean;
    onOpenChange: (open: boolean) => void;
    session: ISession;
}

export default function SessionEditDialog({ dialogOpen, onOpenChange, session }: Props) {
    // Store
    const updateSession = useSessionStore(state => state.updateSession);
    const connectSession = useSessionStore(state => state.connectToSession);

    // Form State
    const [name, setName] = useState<string>(session.name || "My Session");
    const [host, setHost] = useState<string>(session.host || "");
    const [port, setPort] = useState<string>(session.port ? session.port.toString() : "22");
    const [username, setUsername] = useState<string>(session.username || "");
    const [password, setPassword] = useState<string>(session.password || "");
    const [privateKeyPath, setPrivateKeyPath] = useState<string>(session.privateKeyPath || "");
    const [passphrase, setPassphrase] = useState<string>("");

    // Form Validation
    const isFormValid = () => {
        return host && port && username && (password || privateKeyPath);
    };

    // Form Handlers
    const handleConnect = () => {
        if (!isFormValid()) {
            toast.error("Please fill in all required fields.");
            return;
        }

        // Create session object
        const updatedSession = {
            name: name,
            host,
            port: parseInt(port, 10),
            username,
            password: password || undefined,
            privateKeyPath: privateKeyPath || undefined,
            passphrase: passphrase || undefined,
            status: "disconnected",
        } as Omit<ISession, "id" | "createdAt" | "updatedAt" | "lastUsedAt">;

        // Save session to store (this would be replaced with actual store logic)
        const newSession = updateSession(session.id, updatedSession);
        if (!newSession) {
            toast.error("Failed to add session. Please try again.");
            return;
        }

        toast.success(`Session "${session.name}" added successfully!`);

        // Close dialog
        onOpenChange(false);

        // Connect to session
        connectSession(newSession).then((connected) => {
            if (connected) {
                toast.success(`Connected to session: ${newSession}`);
            } else {
                toast.error(`Failed to connect to session: ${newSession}`);
            }
        });
    }

    useEffect(() => {
        // Reset form state when dialog opens
        if (dialogOpen) {
            setName(session.name || "My Session");
            setHost(session.host || "");
            setPort(session.port ? session.port.toString() : "22");
            setUsername(session.username || "");
            setPassword(session.password || "");
            setPrivateKeyPath(session.privateKeyPath || "");
            setPassphrase("");
        }
    }, [open]);

    // Render
    return (
        <Dialog open={dialogOpen} onOpenChange={onOpenChange}>
            <DialogContent
                onOpenAutoFocus={(e) => {
                    e.preventDefault()
                    document.getElementById("host")?.focus();
                }}
            >
                <div className="flex flex-col gap-2">
                    <div
                        className="flex size-11 shrink-0 items-center justify-center rounded-full border"
                        aria-hidden="true"
                    >
                        <Server className="opacity-80" size={16} />
                    </div>
                    <DialogHeader>
                        <DialogTitle className="text-left">
                            Manage Session
                        </DialogTitle>
                        <DialogDescription className="text-left">
                            Edit the session details below.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <form className="space-y-5" onSubmit={(e) => {
                    e.preventDefault();
                    handleConnect();
                }}>
                    <div className="space-y-2">
                        <div className="flex flex-col">
                            <Input
                                id={`name`}
                                placeholder="Session Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full"
                                autoFocus
                            />
                        </div>
                        <div className="flex flex-row gap-2">
                            <Input
                                id={`host`}
                                placeholder="Hostname"
                                value={host}
                                onChange={(e) => setHost(e.target.value)}
                            />
                            <Input
                                id={`port`}
                                placeholder="Port"
                                value={port}
                                onChange={(e) => setPort(e.target.value)}
                                className="w-24"
                            />
                        </div>
                        <div>
                            <Input
                                id={`username`}
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <Tabs defaultValue="tab-1" className="border rounded-lg p-2 bg-muted/50 mt-4">
                            <ScrollArea>
                                <TabsList className="mb-3 w-full">
                                    <TabsTrigger value="tab-1">
                                        <Lock
                                            className="-ms-0.5 me-1.5 opacity-60"
                                            size={16}
                                            aria-hidden="true"
                                        />
                                        Password
                                    </TabsTrigger>
                                    <TabsTrigger value="tab-2" className="group">
                                        <Key
                                            className="-ms-0.5 me-1.5 opacity-60"
                                            size={16}
                                            aria-hidden="true"
                                        />
                                        Key
                                    </TabsTrigger>
                                </TabsList>
                                <ScrollBar orientation="horizontal" />
                            </ScrollArea>
                            <TabsContent value="tab-1">
                                <div>
                                    <Input
                                        id={`password`}
                                        type="password"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </TabsContent>
                            <TabsContent value="tab-2">
                                <div className="flex rounded-md shadow-xs">
                                            <Input
                                                id={"private-key-path"}
                                                className="-me-px flex-1 rounded-e-none shadow-none focus-visible:z-10"
                                                placeholder="Private Key Path"
                                                type="text"
                                                value={privateKeyPath}
                                                onChange={(e) => setPrivateKeyPath(e.target.value)}
                                                autoFocus
                                            />
                                            <button
                                                className="border-input bg-background text-foreground hover:bg-accent hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 inline-flex items-center rounded-e-md border px-3 text-sm font-medium transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                                                type="button"
                                                onClick={async () => {
                                                    const downloads = await open({
                                                        multiple: false, // Set to true if you want to allow multiple file selection
                                                        title: "Select Private Key",
                                                        filters: [{
                                                            name: "Files",
                                                            extensions: [".pem", ".key", ".ppk"] // Allow specific file types
                                                        },]
                                                    });

                                                    if (downloads && typeof downloads === "string") {
                                                        setPrivateKeyPath(downloads);
                                                    } else {
                                                        toast.error("No folder selected");
                                                    }
                                                }}
                                            >
                                                <KeyIcon size={16} className="opacity-60" aria-hidden="true" />
                                                <span className="sr-only">Set Private Key Path</span>
                                            </button>
                                        </div>
                                <div className="mt-2">
                                    <Input
                                        id={`passphrase`}
                                        type="password"
                                        placeholder="Passphrase for private key"
                                        value={passphrase}
                                        onChange={(e) => setPassphrase(e.target.value)}
                                    />
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                    <Button type="submit" className="w-full">
                        Save & Reconnect
                    </Button>

                    <p className="text-muted-foreground text-center text-xs">
                        Fileman saves your session details including passwords and private keys securely.
                        No data leaves your device, everything is stored locally.
                    </p>
                </form>
            </DialogContent>
        </Dialog>
    )
}