import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import ISession from "@/models/session.model";
import useSessionStore from "@/stores/session.store";
import { ArrowRightIcon, Key, KeyIcon, Lock, Server } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { open } from "@tauri-apps/plugin-dialog";
import { Label } from "@/components/ui/label";

type Props = {
    dialogOpen: boolean;
    onOpenChange: (open: boolean) => void;
    trigger: React.ReactNode;
}

export default function SessionWizardDialog({ dialogOpen, onOpenChange, trigger }: Props) {
    // Store
    const sessions = useSessionStore((state) => state.sessions);
    const addSession = useSessionStore(state => state.addSession);
    const connectToSession = useSessionStore(state => state.connectToSession);

    // Step State
    const [step, setStep] = useState(1);
    const totalSteps = 4; // Only one step for now

    // Form State
    const [name, setName] = useState<string>("My Session");
    const [host, setHost] = useState<string>("");
    const [port, setPort] = useState<string>("22"); // Default SSH port
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [privateKeyPath, setPrivateKeyPath] = useState<string>("");
    const [passphrase, setPassphrase] = useState<string>("");

    // Form Validation
    const isFormValid = () => {
        return host && port && username && (password || privateKeyPath);
    };

    const handleConnect = async () => {
        if (!isFormValid()) {
            toast.error("Please fill in all required fields.");
            return;
        }

        // Create session object
        const session = {
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
        const newSession = await addSession(session);
        if (!newSession) {
            toast.error("Failed to add session. Please try again.");
            return;
        }

        toast.success(`Session "${session.name}" added successfully!`);

        // Reset form after connection
        setName("My Session");
        setHost("");
        setPort("22");
        setUsername("");
        setPassword("");
        setPrivateKeyPath("");
        setPassphrase("");

        // Set step to 1
        setStep(1);

        // Close dialog
        onOpenChange(false);

        // Trigger connection
        connectToSession(newSession)
            .then(() => {
                const sessionName = sessions.find(s => s.id === newSession)?.name || "Session";
                toast.success(`Connected to session: ${sessionName}`);

                // Optionally, you can navigate to the session's default path or perform other actions
                // For example, you might want to open a new tab in the file browser
                // useTabStore.getState().createTab(newSession, "/");
            })
            .catch((error) => {
                toast.error(`Failed to connect to session: ${error.message}`);
            });
    }

    // Render
    return (
        <Dialog open={dialogOpen} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
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
                            Session Wizard
                        </DialogTitle>
                        <DialogDescription className="text-left">
                            Connect to a remote server using SSH or SFTP.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <form
                    className="space-y-5 h-[250px] bg-muted/50 p-4 rounded-lg"
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleConnect();
                    }}
                >
                    {/* Step 1 */}
                    {step === 1 && (
                        <div className="space-y-2">
                            <div className="flex flex-col">
                                <Label htmlFor={`name`} className="text-sm font-normal text-muted-foreground px-1">Session Name</Label>
                            </div>
                            <div className="flex flex-col">
                                <Input
                                    id={`name`}
                                    placeholder="Session Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            setStep(2); // Move to next step
                                        }
                                    }}
                                    autoFocus
                                />
                                <p className="text-xs text-muted-foreground py-4 px-2 text-start">
                                    This name will be used to identify the session in the sidebar.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step 2 */}
                    {step === 2 && (
                        <div className="space-y-2">
                            <div className="flex flex-row gap-2">
                                <div className="flex-1 flex flex-col gap-1">
                                    <div>
                                        <Label htmlFor={`host`} className="text-sm font-normal text-muted-foreground px-1">Hostname</Label>
                                    </div>
                                    <div>
                                        <Input
                                            id={`host`}
                                            placeholder="Hostname"
                                            value={host}
                                            onChange={(e) => setHost(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                }
                                            }}
                                            className="flex-1"
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <div>
                                        <Label htmlFor={`port`} className="text-sm font-normal text-muted-foreground px-1">Port</Label>
                                    </div>
                                    <div>
                                        <Input
                                            id={`port`}
                                            placeholder="Port"
                                            value={port}
                                            onChange={(e) => setPort(e.target.value)}
                                            className="w-24"
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    setStep(3); // Move to next step
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col mt-2 gap-1">
                                <div>
                                    <Label htmlFor={`username`} className="text-sm font-normal text-muted-foreground px-1">Username</Label>
                                </div>
                                <div>
                                    <Input
                                        id={`username`}
                                        placeholder="Username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                setStep(3); // Move to next step
                                            }
                                        }}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3 */}
                    {step === 3 && (
                        <div className="space-y-2">
                            <Tabs defaultValue="tab-1">
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
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    setStep(4); // Move to next step
                                                }
                                            }}
                                            className="w-full"
                                            autoFocus
                                        />
                                    </div>
                                </TabsContent>
                                <TabsContent value="tab-2">
                                    <div>
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
                                    </div>
                                    <div className="mt-2">
                                        <Input
                                            id={`passphrase`}
                                            type="password"
                                            placeholder="Passphrase for private key"
                                            value={passphrase}
                                            onChange={(e) => setPassphrase(e.target.value)}
                                            className="w-full"
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    setStep(4); // Move to next step
                                                }
                                            }}
                                        />
                                    </div>
                                </TabsContent>
                            </Tabs>
                            <p className="text-muted-foreground text-center text-xs py-4 px-2">
                                Fileman saves your session details including passwords and private keys securely.
                                No data leaves your device, everything is stored locally.
                            </p>
                        </div>
                    )}

                    {/* Step 4 */}
                    {step === 4 && (
                        <div className="space-y-2">
                            <p className="text-muted-foreground text-center text-sm py-4 px-2">
                                Ready to connect to your session?
                                Click "Connect" to establish the connection using the provided details.
                            </p>
                        </div>
                    )}
                </form>

                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex justify-center space-x-1.5 max-sm:order-1">
                        {[...Array(totalSteps)].map((_, index) => (
                            <div
                                key={index}
                                className={cn(
                                    "bg-primary size-1.5 rounded-full",
                                    index + 1 === step ? "bg-primary" : "opacity-20"
                                )}
                            />
                        ))}
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setStep(step > 1 ? step - 1 : step)}
                        >
                            Previous
                        </Button>
                        {step < totalSteps ? (
                            <Button
                                className="group"
                                type="button"
                                onClick={() => setStep(step + 1)}
                            >
                                Next
                                <ArrowRightIcon
                                    className="-me-1 opacity-60 transition-transform group-hover:translate-x-0.5"
                                    size={16}
                                    aria-hidden="true"
                                />
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                onClick={handleConnect}
                            >
                                Connect
                            </Button>
                        )}
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    )
}