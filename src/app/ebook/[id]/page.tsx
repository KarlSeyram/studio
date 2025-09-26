
"use client";

import Image from "next/image";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart-context";
import { ShoppingCart, Share2 } from "lucide-react";
import { EbookCard } from "@/components/ebook-card";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getSupabase, type Ebook } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export default function EbookDetailPage({ params: { id } }: { params: { id: string } }) {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [ebook, setEbook] = useState<Ebook | null>(null);
  const [relatedEbooks, setRelatedEbooks] = useState<Ebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const ebookId = parseInt(id, 10);
    if (isNaN(ebookId)) {
      notFound();
    }
    
    const fetchEbook = async () => {
        setLoading(true);
        const supabase = getSupabase();

        // Fetch the main ebook
        const { data: ebookData, error: ebookError } = await supabase
            .from('ebooks')
            .select('*')
            .eq('id', ebookId)
            .single();

        if (ebookError || !ebookData) {
            console.error("Error fetching ebook:", ebookError);
            notFound();
        }

        setEbook(ebookData);

        // Fetch related ebooks
        const { data: relatedData, error: relatedError } = await supabase
            .from('ebooks')
            .select('*')
            .neq('id', ebookId)
            .limit(4);
        
        if (relatedError) {
            console.error("Error fetching related ebooks:", relatedError);
        } else {
            setRelatedEbooks(relatedData);
        }

        // Get public URL for cover image
        if (ebookData.coverImageId) {
             const { data: imageData } = supabase.storage.from('ebook-covers').getPublicUrl(ebookData.coverImageId);
             setCoverImageUrl(imageData.publicUrl);
        }

        setLoading(false);
    };

    fetchEbook();
  }, [id]);

  const handleShare = async () => {
    if (!ebook) return;
    const shareData = {
      title: ebook.title,
      text: ebook.description,
      url: window.location.href
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
        navigator.clipboard.writeText(shareData.url);
        toast({
            title: "Link Copied",
            description: "Product link copied to clipboard.",
        })
    }
  };


  if (loading) {
    return (
        <div className="container mx-auto px-4 py-8 md:py-12">
            <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                <div><Skeleton className="aspect-[2/3] w-full max-w-sm mx-auto rounded-lg" /></div>
                <div className="space-y-4">
                    <Skeleton className="h-10 w-3/4" />
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-8 w-1/4" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-12 w-40" />
                </div>
            </div>
        </div>
    )
  }

  if (!ebook) {
    return null; 
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <div className="flex justify-center">
          <div className="relative aspect-[2/3] w-full max-w-sm rounded-lg overflow-hidden shadow-lg">
            {coverImageUrl && (
              <Image
                src={coverImageUrl}
                alt={`Cover of ${ebook.title}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 50vw"
                priority
              />
            )}
          </div>
        </div>
        <div className="flex flex-col justify-center">
          <h1 className="font-headline text-3xl md:text-4xl font-bold mb-2">
            {ebook.title}
          </h1>
          <p className="text-lg text-muted-foreground mb-4">
            by {ebook.author}
          </p>
          <p className="text-2xl font-bold text-primary mb-6">
            GH₵{ebook.price.toFixed(2)}
          </p>
          <p className="text-base text-foreground/80 leading-relaxed mb-6">
            {ebook.description}
          </p>
          <div className="flex items-center gap-2">
            <Button onClick={() => addToCart(ebook)} size="lg" className="w-full md:w-auto">
                <ShoppingCart className="mr-2" />
                Add to Cart
            </Button>
            <Button onClick={handleShare} size="lg" variant="outline" className="w-full md:w-auto">
                <Share2 className="mr-2" />
                Share
            </Button>
          </div>
        </div>
      </div>
      
      {relatedEbooks.length > 0 && (
         <section className="py-12 md:py-20 mt-8 border-t">
            <h2 className="font-headline text-2xl md:text-3xl font-bold text-center mb-10">
            You Might Also Like
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {relatedEbooks.map((relatedEbook) => (
                <EbookCard key={relatedEbook.id} ebook={relatedEbook} />
            ))}
            </div>
        </section>
      )}
    </div>
  );
}
