export const Features = () => {
  return (
    <>
      <div className="bg-linear-to-b from-transparent to-background pt-20" />
      <div className="w-full  border-zinc-800">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-zinc-800 px-px border-t border-b border-zinc-800">
            <div className="col-span-1 bg-background grid grid-cols-1 grid-rows-1 p-8 relative">
              <div className="col-span-1 col-start-1 row-start-1 flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-medium bg-clip-text text-transparent bg-linear-to-b from-amber-100 to-emerald-100">
                    Real-time data
                  </h3>
                  <h4 className="text-md font-mono">
                    See when and where users are
                  </h4>
                </div>

                <p className="text-sm font-mono text-zinc-400">
                  Real-time analytics let you know what's happening in
                  real-time.
                </p>
              </div>
            </div>
            <div className="col-span-1 bg-background grid grid-cols-1 grid-rows-1 p-8 relative">
              <div className="col-span-1 col-start-1 row-start-1 flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-medium bg-clip-text text-transparent bg-linear-to-b from-amber-100 to-emerald-100">
                    Custom events
                  </h3>
                  <h4 className="text-md font-mono">Conversion tracking</h4>
                </div>
                <p className="text-sm font-mono text-zinc-400">
                  Custom events let you track specific user actions and
                  interactions.
                </p>
              </div>
            </div>
            <div className="col-span-1 bg-background grid grid-cols-1 grid-rows-1 p-8 relative">
              <div className="col-span-1 col-start-1 row-start-1 flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-medium bg-clip-text text-transparent bg-linear-to-b from-amber-100 to-emerald-100">
                    Campaign tracking
                  </h3>
                  <h4 className="text-md font-mono">UTM paramaters</h4>
                </div>
                <p className="text-sm font-mono text-zinc-400">
                  Campaign tracking lets you track specific campaigns and
                  channels with UTM parameters.
                </p>
              </div>
            </div>
            <div className="col-span-1 bg-background grid grid-cols-1 grid-rows-1 p-8 relative">
              <div className="col-span-1 col-start-1 row-start-1 flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-medium bg-clip-text text-transparent bg-linear-to-b from-amber-100 to-emerald-100">
                    Session analysis
                  </h3>
                  <h4 className="text-md font-mono">Entry &amp; exit pages</h4>
                </div>
                <p className="text-sm font-mono text-zinc-400">
                  Session analysis lets you see the user journey and how they
                  interact with your website.
                </p>
              </div>
            </div>
            <div className="col-span-1 bg-background grid grid-cols-1 grid-rows-1 p-8 relative">
              <div className="col-span-1 col-start-1 row-start-1 flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-medium bg-clip-text text-transparent bg-linear-to-b from-amber-100 to-emerald-100">
                    Acquisitions
                  </h3>
                  <h4 className="text-md font-mono">Acquisitons</h4>
                </div>
                <p className="text-sm font-mono text-zinc-400">
                  Session analysis lets you see the user journey and how they
                  interact with your website.
                </p>
              </div>
            </div>
            <div className="col-span-1 bg-background grid grid-cols-1 grid-rows-1 p-8 relative">
              <div className="col-span-1 col-start-1 row-start-1 flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-medium bg-clip-text text-transparent bg-linear-to-b from-amber-100 to-emerald-100">
                    Global
                  </h3>
                  <h4 className="text-md font-mono">Geographical data</h4>
                </div>
                <p className="text-sm font-mono text-zinc-400">
                  Geographic data lets you see where your users are coming from
                  and where they are going.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
