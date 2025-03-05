import { Button } from './ui/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/shadcn/card';

export const ThemedButtons = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Themed Buttons</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <div
            className="flex gap-4 items-center flex-col sm:flex-row"
            data-theme="avalanche.network"
          >
            <Button variant="outline">Avalanche.network</Button>
          </div>
          <div
            className="flex gap-4 items-center flex-col sm:flex-row"
            data-theme="0x.city"
          >
            <Button variant="outline">0x.city</Button>
          </div>
          <div
            className="flex gap-4 items-center flex-col sm:flex-row"
            data-theme="defi.build"
          >
            <Button variant="outline">Defi.build</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
