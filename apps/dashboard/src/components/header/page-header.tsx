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
    <div className="container mx-auto mb-6 flex w-full flex-row items-center justify-between gap-4">
      <div className="flex w-full flex-col gap-0.5 sm:gap-2">
        <h1 className="font-bold text-sm sm:text-xl">{title}</h1>
        <p className="inline text-muted-foreground text-xs sm:text-base">
          {description}
        </p>
      </div>
      {children && (
        <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
          {children}
        </div>
      )}
    </div>
  );
};
