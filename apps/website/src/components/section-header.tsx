interface SectionHeaderProps {
  title: string;
  description: string;
  children?: React.ReactNode;
}
export const SectionHeader = ({
  title,
  description,
  children,
}: SectionHeaderProps) => {
  return (
    <div className="container mx-auto flex max-w-4xl flex-col space-y-4 text-center">
      <h2 className="font-regular text-3xl sm:text-5xl">{title}</h2>
      <p className="font-light text-lg text-muted-foreground sm:text-2xl">
        {description}
      </p>
      {children && children}
    </div>
  );
};
