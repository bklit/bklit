interface PageHeaderProps {
  title: string;
  description: string;
  children?: React.ReactNode;
}

export const PageHeader = ({
  title,
  description,
  children,
}: PageHeaderProps) => {
  return (
    <div className="flex justify-between items-center w-full container mx-auto mb-6">
      <div>
        <h1 className="text-xl font-bold">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      {children && (
        <div className="flex items-center gap-2 justify-end">{children}</div>
      )}
    </div>
  );
};
