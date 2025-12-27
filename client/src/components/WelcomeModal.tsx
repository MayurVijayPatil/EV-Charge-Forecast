import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/hooks/use-user";
import { User, Mail, ArrowRight } from "lucide-react";

export function WelcomeModal() {
    const { user, login } = useUser();
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");

    useEffect(() => {
        if (!user) {
            // Delay slightly to ensure app load
            const timer = setTimeout(() => setIsOpen(true), 500);
            return () => clearTimeout(timer);
        } else {
            setIsOpen(false);
        }
    }, [user]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name && email) {
            login(name, email);
            setIsOpen(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            // Prevent closing if no user (force login) logic could be here, 
            // but for better UX we might allow closing, but here we want to enforce it or just persist.
            // Let's force it for now as per user request "whenever user accessing... it should ask".
            if (user) setIsOpen(open);
        }}>
            <DialogContent className="sm:max-w-md [&>button]:hidden">
                {/* [&>button]:hidden hides the close X button to force input */}
                <DialogHeader>
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <User className="w-6 h-6 text-primary" />
                    </div>
                    <DialogTitle className="text-center text-xl">Welcome to EV Forecaster</DialogTitle>
                    <DialogDescription className="text-center">
                        Please enter your details to personalize your experience.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="name"
                                placeholder="John Doe"
                                className="pl-9"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="john@example.com"
                                className="pl-9"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <Button type="submit" className="w-full gap-2">
                        Get Started <ArrowRight className="w-4 h-4" />
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
