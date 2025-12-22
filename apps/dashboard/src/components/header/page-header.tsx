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
    <div className="flex flex-row justify-between items-center w-full container mx-auto mb-6 gap-4">
      <div className="flex flex-col gap-0.5 sm:gap-2 w-full">
        <h1 className="text-sm sm:text-xl font-bold">{title}</h1>
        <p className="inline text-xs sm:text-base text-muted-foreground">
          {description}
        </p>
      </div>
      {children && (
        <div className="flex items-center gap-2 justify-end w-full sm:w-auto">
          {children}
        </div>
      )}
    </div>
  );
};
