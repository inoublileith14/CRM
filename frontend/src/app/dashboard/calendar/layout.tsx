export default function CalendarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="calendar-page -my-3 flex h-[calc(100dvh-4.5rem)] min-h-[24rem] flex-col overflow-hidden sm:-my-4 sm:h-[calc(100dvh-5rem)] lg:-my-5 lg:h-[calc(100dvh-5.5rem)]">
      {children}
    </div>
  );
}
