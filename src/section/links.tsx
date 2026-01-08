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

function Link({ id, name, url, icon }: Link) {
  const { mutate } = useDeleteLink();
  const remove: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation();
    e.preventDefault();
    mutate(id);
  };

  return (
    <Item variant="outline" size="sm" asChild>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="min-w-50 flex-1"
      >
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

  return (
    <Card className="mb-4">
      <CardHeader className="flex justify-between">
        <CardTitle>Links</CardTitle>
        <AddLink />
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 flex-wrap">
          <Collection
            data={data}
            renderItem={Link}
            empty="No links found, add new one?"
          />
        </div>
      </CardContent>
    </Card>
  );
}
