import Header from '@/components/header';
import { MobileBottomNav } from '@/components/mobile-bottom-nav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export default function ProfilePage() {
  // In a real app, you'd fetch user data here.
  const user = {
    name: 'Alex Doe',
    email: 'alex.doe@example.com',
    initials: 'AD',
    imageUrl: 'https://placehold.co/100x100.png',
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 pb-28 md:pb-8">
        <div className="mx-auto grid w-full max-w-2xl gap-2">
          <h1 className="text-3xl font-semibold">Profile</h1>
        </div>
        <div className="mx-auto w-full max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user.imageUrl} alt={user.name} data-ai-hint="user avatar" />
                  <AvatarFallback>{user.initials}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="text-2xl font-bold">{user.name}</p>
                  <p className="text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <Button>Edit Profile</Button>
            </CardContent>
          </Card>
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
}
