import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type Props = {
  nickname: string;
  country: string;
  favorite: string;
  comment: string;
};

export function MapPopup({ nickname, country, favorite, comment }: Props) {
  const initial = nickname.charAt(0).toUpperCase();

  return (
    <Card className="w-64 gap-0 py-0 shadow-xl ring-0 overflow-hidden">
      {/* Green accent bar */}
      <div className="h-1 bg-linear-to-r from-green-500 to-emerald-400 shrink-0" />

      <CardHeader className="px-3 pt-3 pb-2.5 gap-2">
        {/* Avatar + name + country */}
        <div className="flex items-start gap-2.5">
          <div className="size-9 rounded-full bg-linear-to-br from-green-400 to-emerald-600 text-white flex items-center justify-center text-sm font-bold shrink-0 shadow-sm">
            {initial}
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="font-semibold text-[14px] leading-tight text-foreground truncate">
              {nickname}
            </div>
            {country && (
              <Badge variant="outline" className="mt-1 text-[10px] h-4 px-1.5 font-normal text-muted-foreground">
                {country}
              </Badge>
            )}
          </div>
        </div>

        {/* Favorite tool */}
        {favorite && (
          <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-[11px] font-medium rounded-md px-2 py-1">
            <span>⭐</span>
            <span className="wrap-break-word min-w-0">{favorite}</span>
          </div>
        )}
      </CardHeader>

      {comment && (
        <CardContent className="px-3 pt-0 pb-2.5">
          <p className="text-[12px] text-muted-foreground leading-relaxed m-0 line-clamp-5 whitespace-pre-wrap">
            {comment}
          </p>
        </CardContent>
      )}
    </Card>
  );
}
