import { useEffect, useState, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { collection, getDocs, query, where, db } from '@/lib/firebase-compat';
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Advertisement {
  id: string;
  titre: string;
  videoUrl: string;
  isActive: boolean;
}

export default function AdsCarousel() {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'center' });

  useEffect(() => {
    async function fetchAds() {
      try {
        // Récupérer TOUTES les publicités (pas de filtre) pour supporter les anciens et nouveaux champs
        const adsSnap = await getDocs(collection(db, "ads"));
        
        // Filtrer en JavaScript pour inclure à la fois isActive et active (compatibilité)
        const activeAds = adsSnap.documents
          .filter(doc => doc.isActive === true || doc.active === true)
          .map(doc => ({
            id: doc.$id,
            titre: doc.titre || "Publicité",
            videoUrl: doc.videoUrl || doc.videoURL,
            isActive: doc.isActive ?? doc.active ?? false,
          }));

        setAds(activeAds);
      } catch (error) {
        console.error("Erreur lors du chargement des publicités:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAds();
  }, []);

  // Auto-play carousel
  useEffect(() => {
    if (!emblaApi) return;

    const autoplay = setInterval(() => {
      emblaApi.scrollNext();
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(autoplay);
  }, [emblaApi]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  if (loading) {
    return null; // Don't show anything while loading
  }

  if (ads.length === 0) {
    return null; // Don't show carousel if no active ads
  }

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-primary/5 to-primary/10 border-2">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {ads.map((ad) => (
            <div key={ad.id} className="flex-[0_0_100%] min-w-0 relative">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-primary mb-4 text-center">
                  {ad.titre}
                </h3>
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                  <video
                    src={ad.videoUrl}
                    controls
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-contain"
                    data-testid={`video-ad-${ad.id}`}
                  >
                    Votre navigateur ne supporte pas la lecture de vidéos.
                  </video>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      {ads.length > 1 && (
        <>
          <Button
            variant="outline"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background z-10"
            onClick={scrollPrev}
            data-testid="button-carousel-prev"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background z-10"
            onClick={scrollNext}
            data-testid="button-carousel-next"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </>
      )}

      {/* Indicators */}
      {ads.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {ads.map((_, index) => (
            <button
              key={index}
              className="h-2 w-2 rounded-full bg-primary/30 hover:bg-primary/50 transition-colors"
              onClick={() => emblaApi?.scrollTo(index)}
              data-testid={`indicator-${index}`}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
