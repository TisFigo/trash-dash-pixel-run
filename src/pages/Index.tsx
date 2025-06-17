
import TrashDashGame from '@/components/TrashDashGame';
import EmbeddableTrashDash from '@/components/EmbeddableTrashDash';

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Trash Dash Games</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold mb-4 text-center">Full Screen Version</h2>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <TrashDashGame />
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4 text-center">Embeddable Version</h2>
            <div className="flex justify-center">
              <EmbeddableTrashDash />
            </div>
            <div className="mt-4 p-4 bg-gray-50 rounded border">
              <h3 className="font-semibold mb-2">How to embed:</h3>
              <code className="text-xs bg-gray-200 p-2 rounded block">
                {`<iframe src="your-domain.com/embed" width="400" height="600"></iframe>`}
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
