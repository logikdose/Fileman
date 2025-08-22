import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { AppWindowIcon, BookMarkedIcon, Columns3CogIcon } from 'lucide-react'
import { ReactNode } from 'react'

export default function Features() {
    return (
        <section id="features" className="bg-zinc-50 py-16 md:py-32 dark:bg-transparent">
            <div className="@container mx-auto max-w-5xl px-6">
                <div className="text-center">
                    <h2 className="text-balance text-4xl font-semibold lg:text-5xl">
                        SFTP Without Baggage
                    </h2>
                    <p className="mt-4">
                        Fileman is designed to ease your SFTP file management tasks.
                    </p>
                </div>
                <div className="@min-4xl:max-w-full @min-4xl:grid-cols-3 mx-auto mt-8 grid max-w-sm gap-6 *:text-center md:mt-16">
                    <Card className="group shadow-zinc-950/5 bg-background">
                        <CardHeader className="pb-3">
                            <CardDecorator>
                                <AppWindowIcon
                                    className="size-6"
                                    aria-hidden
                                />
                            </CardDecorator>

                            <h3 className="mt-6 font-medium">
                                Tabs like a browser
                            </h3>
                        </CardHeader>

                        <CardContent>
                            <p className="text-sm opacity-50">
                                Open as many SFTP sessions as you want. Hop around, drag stuff, close tabs when you’re done. Feels right, doesn’t it?
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="group shadow-zinc-950/5 bg-background">
                        <CardHeader className="pb-3">
                            <CardDecorator>
                                <BookMarkedIcon
                                    className="size-6"
                                    aria-hidden
                                />
                            </CardDecorator>

                            <h3 className="mt-6 font-medium">
                                Bookmarks
                            </h3>
                        </CardHeader>

                        <CardContent>
                            <p className="mt-3 text-sm opacity-50">
                                Save your go-to servers and folders. One click, you’re in. No more digging through history or typing endless paths.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="group shadow-zinc-950/5 bg-background">
                        <CardHeader className="pb-3">
                            <CardDecorator>
                                <Columns3CogIcon
                                    className="size-6"
                                    aria-hidden
                                />
                            </CardDecorator>

                            <h3 className="mt-6 font-medium">
                                Customizable
                            </h3>
                        </CardHeader>

                        <CardContent>
                            <p className="mt-3 text-sm opacity-50">
                                Fileman’s powered by Rust and Tauri, so it’s quick and doesn’t freak out. Your files stay yours, and your workflow stays smooth.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    )
}

const CardDecorator = ({ children }: { children: ReactNode }) => (
    <div className="relative mx-auto size-36 duration-200 [--color-border:color-mix(in_oklab,var(--color-zinc-950)10%,transparent)] group-hover:[--color-border:color-mix(in_oklab,var(--color-zinc-950)20%,transparent)] dark:[--color-border:color-mix(in_oklab,var(--color-white)15%,transparent)] dark:group-hover:bg-white/5 dark:group-hover:[--color-border:color-mix(in_oklab,var(--color-white)20%,transparent)]">
        <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:24px_24px]"
        />
        <div
            aria-hidden
            className="bg-radial to-background absolute inset-0 from-transparent to-75%"
        />
        <div className="bg-background absolute inset-0 m-auto flex size-12 items-center justify-center border-l border-t">{children}</div>
    </div>
)
