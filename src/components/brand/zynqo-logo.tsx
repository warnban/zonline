import Image from "next/image";
import Link from "next/link";

type Props = {
  showText?: boolean;
  size?: number;
  className?: string;
};

export function ZynqoLogo({ showText = true, size = 32, className = "" }: Props) {
  return (
    <Link href="/" className={`flex shrink-0 items-center gap-2.5 ${className}`}>
      <Image
        src="/icon.png"
        alt="Zynqo"
        width={size}
        height={size}
        className="rounded-lg"
        priority
      />
      {showText && <span className="text-lg font-semibold tracking-tight">Zynqo</span>}
    </Link>
  );
}
