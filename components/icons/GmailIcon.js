import Image from 'next/image';

export default function GmailIcon({ size = 16, style, ...props }) {
  return (
    <Image
      src="/icons/gmail.svg"
      alt="Email"
      width={size}
      height={size}
      style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
      {...props}
    />
  );
}
