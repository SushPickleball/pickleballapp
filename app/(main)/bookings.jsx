import Header from "@/components/Header";
import ScreenWrapper from "@/components/ScreenWrapper";
import { theme } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { hp, wp } from "@/helpers/common";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Pressable,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View
} from "react-native";

const Bookings = () => {
    const { user } = useAuth();
    const router = useRouter();
    
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchBookings = async () => {
        try {
            const { data, error } = await supabase
                .from('bookings')
                .select(`
                    *,
                    courtSlots (
                        *,
                        courts (
                            *,
                            facilities (*)
                        )
                    )
                `)
                .eq('userId', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching bookings:', error);
                return;
            }

            setBookings(data || []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchBookings();
        setRefreshing(false);
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const getNextDateForDay = (dayName) => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const today = new Date();
        const todayDay = today.getDay();
        const targetDay = days.indexOf(dayName);
        
        let daysToAdd = targetDay - todayDay;
        if (daysToAdd <= 0) daysToAdd += 7;
        
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + daysToAdd);
        
        return targetDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'short', 
            day: 'numeric' 
        });
    };

    const getBookingStatus = (booking) => {
        if (booking.status === false) {
            return { text: 'Cancelled', color: theme.colors.error, icon: 'close-circle' };
        }
        
        return { text: 'Upcoming', color: theme.colors.accent, icon: 'time' };
    };

    const onCancelBooking = async (booking) => {
        Alert.alert(
            "Cancel Booking",
            "Are you sure you want to cancel this booking?",
            [
                { text: "No", style: "cancel" },
                { 
                    text: "Yes, Cancel", 
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const { error: bookingError } = await supabase
                                .from('bookings')
                                .update({ status: false })
                                .eq('id', booking.id);

                            if (bookingError) {
                                console.error('Error cancelling booking:', bookingError);
                                Alert.alert("Error", "Failed to cancel booking");
                                return;
                            }

                            const { error: slotError } = await supabase
                                .from('courtSlots')
                                .update({ isBooked: false })
                                .eq('id', booking.courtSlotId);

                            if (slotError) {
                                console.error('Error updating slot:', slotError);
                            }

                            Alert.alert("Success", "Booking cancelled successfully");
                            fetchBookings();

                        } catch (error) {
                            console.error('Error:', error);
                            Alert.alert("Error", "Something went wrong");
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <ScreenWrapper bg="white">
                <StatusBar barStyle="dark-content" backgroundColor="white" />
                <Header title="My Bookings" />
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading bookings...</Text>
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper bg="white">
            <StatusBar barStyle="dark-content" backgroundColor="white" />
            
            <Header title="My Bookings" />

            <ScrollView 
                style={styles.container}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#007AFF']}
                    />
                }
            >
                {bookings.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="calendar-outline" size={64} color="#ccc" />
                        <Text style={styles.emptyTitle}>No Bookings Yet</Text>
                        <Text style={styles.emptyText}>
                            You haven't made any bookings yet. Start by exploring facilities and booking a slot!
                        </Text>
                        <Pressable 
                            style={styles.exploreButton}
                            onPress={() => router.push('home')}
                        >
                            <Text style={styles.exploreButtonText}>Explore Facilities</Text>
                        </Pressable>
                    </View>
                ) : (
                    <View style={styles.bookingsContainer}>
                        {bookings.map((booking) => {
                            const status = getBookingStatus(booking);
                            const facility = booking.courtSlots?.courts?.facilities;
                            const court = booking.courtSlots?.courts;
                            const slot = booking.courtSlots;
                            
                            if (!facility || !court || !slot) return null;

                            return (
                                <View key={booking.id} style={styles.bookingCard}>
                                    <View style={styles.bookingHeader}>
                                        <View style={styles.facilityInfo}>
                                            <Ionicons name="business" size={20} color={theme.colors.accent} />
                                            <Text style={styles.facilityName}>{facility.name}</Text>
                                        </View>
                                        <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
                                            <Ionicons name={status.icon} size={16} color={status.color} />
                                            <Text style={[styles.statusText, { color: status.color }]}>
                                                {status.text}
                                            </Text>
                                        </View>
                                    </View>
                                    
                                    <View style={styles.bookingDetails}>
                                        <View style={styles.detailRow}>
                                            <Ionicons name="location" size={16} color="#666" />
                                            <Text style={styles.detailText}>{facility.location}</Text>
                                        </View>
                                        
                                        <View style={styles.detailRow}>
                                            <Ionicons name="tennisball" size={16} color="#666" />
                                            <Text style={styles.detailText}>{court.courtName}</Text>
                                        </View>
                                        
                                        <View style={styles.detailRow}>
                                            <Ionicons name="time" size={16} color="#666" />
                                            <Text style={styles.detailText}>
                                                {slot.startTime} - {slot.endTime}
                                            </Text>
                                        </View>
                                        
                                        <View style={styles.detailRow}>
                                            <Ionicons name="calendar" size={16} color="#666" />
                                            <Text style={styles.detailText}>
                                                {getNextDateForDay(slot.dayOfWeek)}
                                            </Text>
                                        </View>
                                    </View>
                                    
                                    <View style={styles.bookingFooter}>
                                        <Text style={styles.bookingDate}>
                                            Booked on {new Date(booking.created_at).toLocaleDateString('en-US', { 
                                                month: 'short', 
                                                day: 'numeric', 
                                                year: 'numeric' 
                                            })}
                                        </Text>
                                        
                                        {status.text === 'Upcoming' && (
                                            <Pressable 
                                                style={styles.cancelButton}
                                                onPress={() => onCancelBooking(booking)}
                                            >
                                                <Ionicons name="close-circle" size={16} color={theme.colors.error} />
                                                <Text style={styles.cancelButtonText}>Cancel</Text>
                                            </Pressable>
                                        )}
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}
            </ScrollView>
        </ScreenWrapper>
    );
};

export default Bookings;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: wp(8),
        paddingVertical: hp(10),
    },
    emptyTitle: {
        fontSize: theme.fontSizes.xl,
        fontWeight: '600',
        color: '#666',
        marginTop: hp(2),
        marginBottom: hp(1),
    },
    emptyText: {
        fontSize: theme.fontSizes.base,
        color: '#999',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: hp(4),
    },
    exploreButton: {
        backgroundColor: theme.colors.accent,
        paddingHorizontal: wp(6),
        paddingVertical: hp(2),
        borderRadius: theme.radius.lg,
    },
    exploreButtonText: {
        fontSize: theme.fontSizes.base,
        fontWeight: '600',
        color: 'white',
    },
    bookingsContainer: {
        paddingHorizontal: wp(4),
        paddingVertical: hp(3),
    },
    bookingCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        padding: hp(3),
        marginBottom: hp(2),
        borderWidth: 1,
        borderColor: theme.colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    bookingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: hp(2),
    },
    facilityInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    facilityName: {
        fontSize: theme.fontSizes.lg,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginLeft: wp(1),
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: wp(2),
        paddingVertical: hp(0.5),
        borderRadius: theme.radius.sm,
    },
    statusText: {
        fontSize: theme.fontSizes.xs,
        fontWeight: '600',
        marginLeft: wp(0.5),
    },
    bookingDetails: {
        gap: hp(1),
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailText: {
        fontSize: theme.fontSizes.sm,
        color: theme.colors.text.secondary,
        marginLeft: wp(1),
        flex: 1,
    },
    bookingFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: hp(2),
        paddingTop: hp(2),
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    bookingDate: {
        fontSize: theme.fontSizes.xs,
        color: theme.colors.text.tertiary,
    },
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: wp(2),
        paddingVertical: hp(0.5),
        borderRadius: theme.radius.sm,
        backgroundColor: theme.colors.background,
    },
    cancelButtonText: {
        fontSize: theme.fontSizes.xs,
        fontWeight: '600',
        color: theme.colors.error,
        marginLeft: wp(0.5),
    },
});
