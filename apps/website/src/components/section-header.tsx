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
    <div className="container mx-auto max-w-4xl flex flex-col text-center space-y-4">
      <h2 className="text-3xl sm:text-5xl font-regular">{title}</h2>
      <p className="text-lg sm:text-2xl font-light text-muted-foreground">
        {description}
      </p>
      {children && children}
    </div>
  );
};
