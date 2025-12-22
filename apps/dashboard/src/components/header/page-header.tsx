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
    <div className="container mx-auto mb-6 flex w-full flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="font-bold text-xl">{title}</h1>
        <p className="hidden text-muted-foreground sm:inline">{description}</p>
      </div>
      {children && (
        <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
          {children}
        </div>
      )}
    </div>
  );
};
