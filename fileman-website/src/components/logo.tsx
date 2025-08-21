import { cn } from '../lib/utils'
import Image from 'next/image'

export const Logo = ({ className, uniColor }: { className?: string; uniColor?: boolean }) => {
    return (
        <div className='flex flex-row gap-2 items-center'>
            <Image
                className="bg-background relative hidden rounded-2xl dark:block bg-cover"
                src="/fileman-icon.png"
                alt="app screen"
                width="42"
                height="42"
            />
            <span>Fileman</span>
        </div>
    )
}

export const LogoIcon = ({ className, uniColor }: { className?: string; uniColor?: boolean }) => {
    return (
        <Image
            className="bg-background relative hidden rounded-2xl dark:block bg-cover"
            src="/fileman-icon.png"
            alt="app screen"
            width="42"
            height="42"
        />
    )
}