import { SessionCreator } from '@/components/SessionCreator';

const Home = () => {
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          UNO Score Table
        </h1>

        <SessionCreator />
      </div>
    </main>
  );
};

export default Home;
