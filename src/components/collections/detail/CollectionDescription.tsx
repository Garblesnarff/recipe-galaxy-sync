
interface CollectionDescriptionProps {
  description?: string;
}

export const CollectionDescription = ({ description }: CollectionDescriptionProps) => {
  if (!description) return null;
  
  return (
    <div className="mb-6">
      <p className="text-gray-700">{description}</p>
    </div>
  );
};
