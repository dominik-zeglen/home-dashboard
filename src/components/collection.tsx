import { Loader } from "lucide-react";
import React from "react";

export function Collection<T extends { id: any }>({
  data,
  renderItem: Item,
  empty = "No items found.",
}: {
  data: T[] | undefined;
  renderItem: React.ComponentType<T & { index: number }>;
  empty?: React.ReactNode;
}) {
  if (data === undefined)
    return (
      <div className="p-4">
        <Loader className="animate-spin mx-auto" />
      </div>
    );
  if (data.length === 0)
    return <div className="text-muted-foreground">{empty}</div>;
  return data.map((item, index) => (
    <Item key={item.id} index={index} {...item} />
  ));
}
