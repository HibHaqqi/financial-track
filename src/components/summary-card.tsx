import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CategoryIcon from "./category-icon";

interface SummaryCardProps {
  title: string;
  value: number;
  iconName: string;
  isCurrency?: boolean;
}

export default function SummaryCard({ title, value, iconName, isCurrency = true }: SummaryCardProps) {
  // Format value with compact notation for large numbers
  const formatCompactNumber = (num: number) => {
    if (Math.abs(num) >= 1000000) {
      return new Intl.NumberFormat('id-ID', {
        notation: 'compact',
        compactDisplay: 'short',
        maximumFractionDigits: 1
      }).format(num);
    }
    if (Math.abs(num) >= 10000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return new Intl.NumberFormat('id-ID').format(num);
  };

  const formattedValue = isCurrency ? formatCompactNumber(value) : value;
  const textColor = () => {
    if (!isCurrency) return '';
    if (title.toLowerCase().includes('balance')) {
        return value >= 0 ? 'text-green-600' : 'text-red-600';
    }
    return '';
  }


  return (
    <Card className="h-full min-h-[120px] overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
        <CardTitle className="text-sm font-medium truncate pr-2">{title}</CardTitle>
        <CategoryIcon name={iconName} className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      </CardHeader>
      <CardContent className="flex flex-col justify-center pb-4 pt-0 px-4 overflow-hidden">
        <div className={`text-xl sm:text-2xl font-bold ${textColor()} truncate`}>
          {formattedValue}
        </div>
      </CardContent>
    </Card>
  );
}
