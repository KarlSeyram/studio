
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, notFound, useParams } from "next/navigation";
import { ChevronLeft, Upload, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getSupabase, type Ebook } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

export default function EbookEditPage() {
  const params = useParams();
  const { id: idParam } = params;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;
  
  const { toast } = useToast();
  const router = useRouter();
  const [ebook, setEbook] = useState<Ebook | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [price, setPrice] = useState(0);
  const [description, setDescription] = useState("");
  const [coverImageId, setCoverImageId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);

  const fetchEbook = useCallback(async (ebookId: number) => {
    setIsFetching(true);
    const supabase = getSupabase();
    const { data, error } = await supabase.from('ebooks').select('*').eq('id', ebookId).single();

    if (error || !data) {
      toast({
        title: "Error fetching ebook",
        description: error?.message || "Ebook not found.",
        variant: "destructive",
      });
      notFound();
    } else {
      setEbook(data);
      setTitle(data.title);
      setAuthor(data.author);
      setPrice(data.price);
      setDescription(data.description);
      setCoverImageId(data.coverImageId);
      
      if (data.coverImageId) {
        const { data: imageData } = supabase.storage.from('ebook-covers').getPublicUrl(data.coverImageId);
        setCoverImageUrl(imageData.publicUrl);
      }
    }
    setIsFetching(false);
  }, [toast]);

  useEffect(() => {
    if (!id) return;
    const ebookId = parseInt(id, 10);
    if (!isNaN(ebookId)) {
      fetchEbook(ebookId);
    }
  }, [id, fetchEbook]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ebook) return;
    setIsLoading(true);

    const supabase = getSupabase();
    const { error } = await supabase.from('ebooks').update({
        title,
        author,
        price,
        description,
        coverImageId
    }).eq('id', ebook.id);

    setIsLoading(false);
    
    if (error) {
         toast({
            title: "Error updating ebook",
            description: error.message,
            variant: "destructive"
        });
    } else {
        toast({
            title: "Ebook Updated",
            description: `"${title}" has been successfully updated.`,
        });
        router.push('/admin');
    }
  };
  
  if (isFetching) {
    return <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>;
  }

  return (
    <div className="mx-auto grid max-w-[59rem] flex-1 auto-rows-max gap-4">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" asChild>
          <Link href="/admin">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          Edit: {ebook?.title}
        </h1>
        <Badge variant="outline" className="ml-auto sm:ml-0">
          In Stock
        </Badge>
        <div className="hidden items-center gap-2 md:ml-auto md:flex">
          <Button variant="outline" size="sm" asChild>
             <Link href="/admin">Discard</Link>
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
        <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Ebook Details</CardTitle>
              <CardDescription>
                Update the title, author, description, and price of the ebook.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    type="text"
                    className="w-full"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                 <div className="grid gap-3">
                  <Label htmlFor="author">Author</Label>
                  <Input
                    id="author"
                    type="text"
                    className="w-full"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-32"
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="price">Price (GH₵)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                  />
                </div>
                 <div className="grid gap-3">
                  <Label htmlFor="coverImageId">Cover Image ID</Label>
                  <Input
                    id="coverImageId"
                    type="text"
                    className="w-full"
                    value={coverImageId}
                    onChange={(e) => setCoverImageId(e.target.value)}
                    disabled
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Cover Image</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                <div className="relative aspect-[2/3] w-full rounded-md overflow-hidden border">
                    {coverImageUrl ? (
                         <Image
                            alt="Product image"
                            className="object-cover"
                            fill
                            src={coverImageUrl}
                         />
                    ) : (
                        <div className="flex items-center justify-center h-full bg-muted text-muted-foreground">
                            No Image
                        </div>
                    )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="ghost" disabled>
                    <Upload className="h-4 w-4" />
                    <span className="ml-2">Upload</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
       <div className="flex items-center justify-center gap-2 md:hidden">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin">Discard</Link>
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
    </div>
  );
}
