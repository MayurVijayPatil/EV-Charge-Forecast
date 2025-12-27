import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface User {
    name: string;
    email: string;
}

interface UserContextType {
    user: User | null;
    login: (name: string, email: string) => void;
    logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        // Load from local storage on mount
        const storedUser = localStorage.getItem("ev_user");
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Failed to parse user from local storage", e);
            }
        }
    }, []);

    const login = (name: string, email: string) => {
        const newUser = { name, email };
        setUser(newUser);
        localStorage.setItem("ev_user", JSON.stringify(newUser));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("ev_user");
        // Optional: Reload page to clear any other state if needed
        window.location.reload();
    };

    return (
        <UserContext.Provider value={{ user, login, logout }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
}
