type LoadingProps = {
  message?: string;
};

export const Loading = ({ message = '読み込み中...' }: LoadingProps) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-4 py-16"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500" />
      <p className="text-xl text-gray-600">{message}</p>
    </div>
  );
};
