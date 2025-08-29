import Avatar from "@/components/Avatar";
import Header from "@/components/Header";
import ScreenWrapper from "@/components/ScreenWrapper";
import { theme } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { hp, wp } from "@/helpers/common";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View
} from "react-native";

const Profile = () => {
    const { user, setAuth } = useAuth();
    const router = useRouter();

    const onLogout = async () => {
        Alert.alert(
            "Sign Out",
            "Are you sure you want to sign out?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Sign Out",
                    style: "destructive",
                    onPress: async () => {
                        const { error } = await supabase.auth.signOut();
                        if (error) {
                            Alert.alert("Error", "Failed to sign out");
                        }
                    }
                }
            ]
        );
    };







    const EditButton = () => (
        <Pressable 
            onPress={() => router.push('editProfile')}
            style={styles.editIconButton}
        >
            <Ionicons 
                name="pencil" 
                size={20} 
                color={theme.colors.text.primary} 
            />
        </Pressable>
    );

    return (
        <ScreenWrapper bg="white">
            <StatusBar barStyle="dark-content" backgroundColor="white" />
            
            <Header 
                title="Profile" 
                rightComponent={<EditButton />}
            />

            <ScrollView 
                style={styles.container}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.profileSection}>
                    <Avatar 
                        uri={user?.image} 
                        size={hp(12)} 
                        rounded={hp(6)}
                        style={styles.avatar}
                    />
                    <Text style={styles.userName}>
                        {user?.name || user?.email?.split('@')[0] || 'User'}
                    </Text>
                    <Text style={styles.userEmail}>
                        {user?.email || 'user@example.com'}
                    </Text>
                </View>

                <View style={styles.detailsSection}>
                    <View style={styles.infoCard}>
                        <View style={styles.cardHeader}>
                            <View style={styles.iconContainer}>
                                <Ionicons name="location" size={18} color={theme.colors.accent} />
                            </View>
                            <Text style={styles.cardTitle}>Location</Text>
                        </View>
                        <Text style={[styles.cardContent, !user?.address && styles.placeholderText]}>
                            {user?.address || 'Add your location'}
                        </Text>
                    </View>
                    
                    <View style={styles.infoCard}>
                        <View style={styles.cardHeader}>
                            <View style={styles.iconContainer}>
                                <Ionicons name="call" size={18} color={theme.colors.warning} />
                            </View>
                            <Text style={styles.cardTitle}>Phone</Text>
                        </View>
                        <Text style={[styles.cardContent, !user?.phoneNumber && styles.placeholderText]}>
                            {user?.phoneNumber || 'Add your phone number'}
                        </Text>
                    </View>
                    
                    <View style={styles.infoCard}>
                        <View style={styles.cardHeader}>
                            <View style={styles.iconContainer}>
                                <Ionicons name="document-text" size={18} color={theme.colors.success} />
                            </View>
                            <Text style={styles.cardTitle}>About</Text>
                        </View>
                        <Text style={[styles.cardContent, !user?.bio && styles.placeholderText]}>
                            {user?.bio || 'Tell us about yourself'}
                        </Text>
                    </View>
                </View>





                        <View style={styles.bookingsSection}>
                            <Pressable 
                                style={styles.bookingsButton} 
                                onPress={() => router.push('bookings')}
                            >
                                <Ionicons name="calendar-outline" size={20} color={theme.colors.accent} />
                                <Text style={styles.bookingsText}>My Bookings</Text>
                            </Pressable>
                        </View>

                        <View style={styles.bookingsSection}>
                            <Pressable 
                                style={styles.bookingsButton} 
                                onPress={() => router.push('myFacilities')}
                            >
                                <Ionicons name="business-outline" size={20} color={theme.colors.accent} />
                                <Text style={styles.bookingsText}>My Facilities</Text>
                            </Pressable>
                        </View>

                        <View style={styles.bookingsSection}>
                            <Pressable 
                                style={styles.bookingsButton} 
                                onPress={() => router.push('myFacilityBookings')}
                            >
                                <Ionicons name="people-outline" size={20} color={theme.colors.accent} />
                                <Text style={styles.bookingsText}>My Facility Bookings</Text>
                            </Pressable>
                        </View>

                        <View style={styles.logoutSection}>
                            <Pressable style={styles.logoutButton} onPress={onLogout}>
                                <Ionicons name="log-out-outline" size={20} color={theme.colors.error} />
                                <Text style={styles.logoutText}>Sign Out</Text>
                            </Pressable>
                        </View>
            </ScrollView>
        </ScreenWrapper>
    );
};

export default Profile;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    editIconButton: {
        padding: hp(1),
        borderRadius: theme.radius.sm,
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    profileSection: {
        alignItems: 'center',
        paddingVertical: hp(4),
        paddingHorizontal: wp(4),
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    avatar: {
        marginBottom: hp(2),
    },
    userName: {
        fontSize: theme.fontSizes['2xl'],
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: hp(0.5),
    },
    userEmail: {
        fontSize: theme.fontSizes.base,
        color: theme.colors.text.secondary,
        marginBottom: hp(1),
    },
    detailsSection: {
        paddingHorizontal: wp(4),
        paddingVertical: hp(2),
        gap: hp(2),
    },
    infoCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        padding: hp(2.5),
        borderWidth: 1,
        borderColor: theme.colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp(1.5),
    },
    iconContainer: {
        width: hp(4),
        height: hp(4),
        borderRadius: hp(2),
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: wp(3),
    },
    cardTitle: {
        fontSize: theme.fontSizes.base,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    cardContent: {
        fontSize: theme.fontSizes.sm,
        color: theme.colors.text.secondary,
        lineHeight: 20,
    },
    placeholderText: {
        fontStyle: 'italic',
        color: theme.colors.text.tertiary,
    },

    bookingsSection: {
        paddingHorizontal: wp(4),
        paddingVertical: hp(2),
    },
    bookingsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        paddingVertical: hp(2.5),
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    bookingsText: {
        fontSize: theme.fontSizes.base,
        fontWeight: '600',
        color: theme.colors.accent,
        marginLeft: wp(1),
    },
    logoutSection: {
        paddingHorizontal: wp(4),
        paddingVertical: hp(2),
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.background,
        borderRadius: theme.radius.lg,
        paddingVertical: hp(2.5),
        borderWidth: 1,
        borderColor: theme.colors.error,
    },
    logoutText: {
        fontSize: theme.fontSizes.base,
        fontWeight: '600',
        color: theme.colors.error,
        marginLeft: wp(1),
    },
})