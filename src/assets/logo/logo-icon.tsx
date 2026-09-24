export default function LogoIcon({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <span className="inline-flex shrink-0 items-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/tiny-aws-light.png"
        alt="tiny-aws"
        className={`${className} object-contain dark:hidden`}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/tiny-aws-dark.png"
        alt="tiny-aws"
        className={`${className} hidden object-contain dark:block`}
      />
    </span>
  );
}
