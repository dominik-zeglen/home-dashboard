import {
  Item,
  ItemActions,
  ItemContent,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import React from "react";
import {
  Link,
  PutLink,
  useDeleteLink,
  useLinkOrder,
  useLinks,
  usePutLink,
} from "../api/link";
import { Plus, Trash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collection } from "../components/collection";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import urlJoin from "url-join";

function AddLink() {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<PutLink>({
    name: "",
    url: "",
    icon: "",
  });
  const { mutate: addLink } = usePutLink(() => {
    setOpen(false);
  });

  const submit = (
    e: React.MouseEvent<HTMLButtonElement> | React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    addLink({
      ...form,
      icon: form.icon === "" ? undefined : form.icon,
    });
  };

  const updateForm = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  React.useEffect(() => {
    setForm({ name: "", url: "", icon: "" });
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="outline"
          className="relative bottom-2 left-2"
        >
          <Plus />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Add Link</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            <Input
              className="mb-4"
              type="text"
              placeholder="Link label..."
              value={form.name}
              onChange={updateForm}
              name="name"
            />
            <Input
              className="mb-4"
              type="text"
              placeholder="Link URL..."
              value={form.url}
              onChange={updateForm}
              name="url"
            />
            <Input
              type="text"
              placeholder="Icon URL..."
              value={form.icon}
              onChange={updateForm}
              name="icon"
            />
          </DialogDescription>
          <DialogFooter>
            <Button onClick={submit}>Add</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const HighlightContext = React.createContext<number | null>(null);

function Link({
  id,
  name,
  url,
  icon,
  index,
  onDrag,
  onDragStart,
  onDragEnd,
}: Link & {
  index: number;
  onDrag?: React.DragEventHandler<HTMLDivElement>;
  onDragStart?: React.DragEventHandler<HTMLDivElement>;
  onDragEnd?: React.DragEventHandler<HTMLDivElement>;
}) {
  const { mutate } = useDeleteLink();
  const remove: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation();
    e.preventDefault();
    mutate(id);
  };
  const highlightIndex = React.useContext(HighlightContext);
  const highlight = highlightIndex === index;

  return (
    <Item
      variant="outline"
      size="sm"
      asChild
      draggable
      onDrag={onDrag}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="min-w-50 flex-1 relative"
      >
        {highlight && (
          <div className="absolute w-0 border-2 h-full border-gray-200 pointer-events-none inline-block -left-3" />
        )}
        <ItemMedia>
          <img
            src={icon ? icon : urlJoin(url, "favicon.ico")}
            alt="Favicon"
            className="h-4 w-4"
          />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>{name}</ItemTitle>
        </ItemContent>
        <ItemActions>
          <Button size="icon" variant="ghost" onClick={remove}>
            <Trash />
          </Button>
        </ItemActions>
      </a>
    </Item>
  );
}

export function Links() {
  const { data } = useLinks();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const insertBeforeIndexRef = React.useRef<number | null>(null);
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
  const [insertBeforeIndex, setInsertBeforeIndex] = React.useState<
    number | null
  >(null);
  const { mutate: updateLinkOrder } = useLinkOrder();

  const LinkItem = React.useCallback(
    (props) => (
      <Link
        onDragStart={() => {
          setDraggedIndex(props.index);
        }}
        onDrag={(event) => {
          if (event.clientX === 0 && event.clientY === 0) {
            return;
          }

          const siblings = new Array<Element>();

          for (let i = 0; i < containerRef.current!.children.length; i++) {
            const child = containerRef.current!.children.item(i);
            if (child) {
              siblings.push(child);
            }
          }

          const midPoints = siblings.map((s) => {
            const rect = s.getBoundingClientRect();
            return [rect.left + rect.width / 2, rect.top + rect.height / 2];
          });

          const closestSegment = midPoints.reduce((closest, point) => {
            if (
              Math.abs(closest - event.clientY) >
              Math.abs(point[1] - event.clientY)
            ) {
              return point[1];
            }

            return closest;
          }, midPoints[0][1]);

          let closestDistance = Infinity;
          let closestIndex = -1;
          for (let i = midPoints.length - 1; i >= 0; i--) {
            const [x, y] = midPoints[i];
            const distance = Math.hypot(x - event.clientX, y - event.clientY);
            if (
              distance < closestDistance &&
              Math.abs(y - closestSegment) < 1
            ) {
              closestDistance = distance;
              closestIndex = i;
            }
          }

          const [closestMidpointX] = midPoints[closestIndex];

          if (
            Math.hypot(closestSegment - event.clientY) > 50 ||
            closestDistance > 300
          ) {
            setInsertBeforeIndex(null);
            insertBeforeIndexRef.current = null;
            return;
          }

          let indexToInsert = closestIndex;
          if (
            closestMidpointX < event.clientX &&
            indexToInsert < siblings.length - 1 &&
            midPoints[indexToInsert][1] === midPoints[indexToInsert + 1][1]
          ) {
            indexToInsert = closestIndex + 1;
          }

          setInsertBeforeIndex(indexToInsert);
          insertBeforeIndexRef.current = indexToInsert;
        }}
        onDragEnd={() => {
          if (insertBeforeIndexRef.current !== null) {
            updateLinkOrder({
              id: props.id,
              index: insertBeforeIndexRef.current,
            });
          }
          setInsertBeforeIndex(null);
          insertBeforeIndexRef.current = null;
          setDraggedIndex(null);
        }}
        {...props}
      />
    ),
    [containerRef],
  );

  const sortedData = React.useMemo(() => {
    if (!data) return data;
    console.log(draggedIndex, insertBeforeIndex);
    if (
      insertBeforeIndex === null ||
      draggedIndex === null ||
      draggedIndex === insertBeforeIndex
    )
      return data;

    const newData = [...data];
    const [movedItem] = newData.splice(draggedIndex, 1);
    newData.splice(insertBeforeIndex, 0, movedItem);
    return newData;
  }, [data, insertBeforeIndex, draggedIndex]);

  return (
    <Card className="mb-4">
      <CardHeader className="flex justify-between">
        <CardTitle>Links</CardTitle>
        <AddLink />
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 flex-wrap" ref={containerRef}>
          <HighlightContext.Provider value={insertBeforeIndex}>
            <Collection
              data={sortedData}
              renderItem={LinkItem}
              empty="No links found, add new one?"
            />
          </HighlightContext.Provider>
        </div>
      </CardContent>
    </Card>
  );
}
