import CollectionList from '../../components/admin/CollectionList';

const HavendripCollection = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Havendrip Collections</h1>
      </div>
      
      <CollectionList />
    </div>
  );
};

export default HavendripCollection; 