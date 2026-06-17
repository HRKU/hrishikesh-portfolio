import Image from 'next/image';

export default function LinkedinIcon({ size = 16, style, ...props }) {
  return (
    <Image
      src="/icons/linkedin.svg"
      alt="LinkedIn"
      width={size}
      height={size}
      style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
      {...props}
    />
  );
}
