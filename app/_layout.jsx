import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { getUserData } from "@/services/userService";
import { Stack, useRouter } from "expo-router";
import React, { useEffect } from "react";






const _layout = () => {
    return (
        <AuthProvider>
            <MainLayout />
        </AuthProvider>
    )
}



const MainLayout = () => {
    const {setAuth, setUserData} = useAuth();
    const router = useRouter();
    useEffect(() => {
        supabase.auth.onAuthStateChange((_event, session) => {
            console.log("session", session?.user?.id);
            if (session) {
                setAuth(session?.user);
                updateUserData(session?.user, session?.user?.email);
                router.replace("/home");
            } else {
                setAuth(null);
                router.replace("/welcome");
            }
        })
    }, []);

    const updateUserData = async (user, email) => {
        let res = await getUserData(user.id);
        if (res.success) {
            setUserData({...res.data, email: email});
        }
    }
    return (
       <Stack>
        <Stack.Screen name="index" options={{headerShown: false}} />
        <Stack.Screen name="welcome" options={{headerShown: false}} />
        <Stack.Screen name="login" options={{headerShown: false}} />
        <Stack.Screen name="signup" options={{headerShown: false}} />
        <Stack.Screen name="(main)/home" options={{headerShown: false}} />
        <Stack.Screen name="(main)/notifications" options={{headerShown: false}} /> 
        <Stack.Screen name="(main)/profile" options={{headerShown: false}} />
        <Stack.Screen name="(main)/newPost" options={{headerShown: false}} />
        <Stack.Screen name="(main)/editProfile" options={{headerShown: false}} />
        <Stack.Screen name="(main)/facility" options={{headerShown: false}} />
        <Stack.Screen name="(main)/court" options={{headerShown: false}} />
        <Stack.Screen name="(main)/bookingConfirmation" options={{headerShown: false}} />
        <Stack.Screen name="(main)/bookings" options={{headerShown: false}} />
        <Stack.Screen name="(main)/myFacilities" options={{headerShown: false}} />
        <Stack.Screen name="(main)/editFacility" options={{headerShown: false}} />
        <Stack.Screen name="(main)/myFacilityBookings" options={{headerShown: false}} />
       </Stack>
    )
}

export default _layout;
