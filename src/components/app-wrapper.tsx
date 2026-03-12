import AsideBar from "./aside-bar";

interface Props {
    children: React.ReactNode;
}

function AppWrapper({ children }: Props) {
    return (
        <div className="h-full">
            {/* toolbar */}
            <AsideBar />
            <main className="lg:pl-10 h-full">{children}</main>
        </div>
    );
}

export default AppWrapper;
