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
    Image,
    Pressable,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View
} from "react-native";

const MyFacilities = () => {
    const { user } = useAuth();
    const router = useRouter();
    
    const [facilities, setFacilities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchMyFacilities = async () => {
        try {
            console.log('Fetching facilities for user:', user.id);
            
            const { data, error } = await supabase
                .from('facilities')
                .select(`
                    *,
                    courts (
                        *,
                        courtSlots (*)
                    )
                `)
                .eq('ownerId', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching facilities:', error);
                return;
            }

            console.log('My facilities:', data);
            
            setFacilities(data || []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchMyFacilities();
        setRefreshing(false);
    };

    useEffect(() => {
        fetchMyFacilities();
    }, []);

    const onEditFacility = (facility) => {
        router.push({
            pathname: 'editFacility',
            params: { id: facility.id }
        });
    };



    const onDeleteFacility = (facility) => {
        Alert.alert(
            "Delete Facility",
            `Are you sure you want to delete "${facility.name}"? This will also delete all courts and slots.`,
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive",
                    onPress: async () => {
                        try {
                            for (const court of facility.courts) {
                                await supabase
                                    .from('courtSlots')
                                    .delete()
                                    .eq('courtId', court.id);
                            }

                            await supabase
                                .from('courts')
                                .delete()
                                .eq('facilityId', facility.id);

                            await supabase
                                .from('facilities')
                                .delete()
                                .eq('id', facility.id);

                            Alert.alert("Success", "Facility deleted successfully");
                            fetchMyFacilities();
                        } catch (error) {
                            console.error('Error deleting facility:', error);
                            Alert.alert("Error", "Failed to delete facility");
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
                <Header title="My Facilities" />
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading your facilities...</Text>
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper bg="white">
            <StatusBar barStyle="dark-content" backgroundColor="white" />
            
            <Header title="My Facilities" />

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
                {facilities.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="business-outline" size={64} color="#ccc" />
                        <Text style={styles.emptyTitle}>No Facilities Yet</Text>
                        <Text style={styles.emptyText}>
                            You haven't created any facilities yet. Start by creating your first pickleball facility!
                        </Text>
                        <Pressable 
                            style={styles.createButton}
                            onPress={() => router.push('newPost')}
                        >
                            <Ionicons name="add" size={20} color="white" />
                            <Text style={styles.createButtonText}>Create Facility</Text>
                        </Pressable>
                    </View>
                ) : (
                    <View style={styles.facilitiesContainer}>
                        {/* Info Note */}
                        <View style={styles.infoNote}>
                            <Ionicons name="information-circle" size={20} color={theme.colors.accent} />
                            <Text style={styles.infoNoteText}>
                                Use the "Edit" button to manage facility details, courts, and time slots all in one place
                            </Text>
                        </View>
                        
                        {facilities.map((facility) => (
                            <View key={facility.id} style={styles.facilityCard}>
                                {/* Facility Header */}
                                <View style={styles.facilityHeader}>
                                    {facility.image && (
                                        <View style={styles.facilityImageContainer}>
                                            <Image 
                                                source={{ uri: facility.image }} 
                                                style={styles.facilityImage}
                                                resizeMode="cover"
                                            />
                                        </View>
                                    )}
                                    
                                    <View style={styles.facilityInfo}>
                                        <Text style={styles.facilityName}>{facility.name}</Text>
                                        <Text style={styles.facilityLocation}>{facility.location}</Text>
                                        <Text style={styles.courtCount}>
                                            {facility.courts?.length || 0} courts
                                        </Text>
                                    </View>
                                    
                                    <View style={styles.facilityActions}>
                                        <Pressable 
                                            style={styles.editButton}
                                            onPress={() => onEditFacility(facility)}
                                        >
                                            <Ionicons name="pencil" size={16} color={theme.colors.accent} />
                                        </Pressable>
                                        <Pressable 
                                            style={styles.deleteButton}
                                            onPress={() => onDeleteFacility(facility)}
                                        >
                                            <Ionicons name="trash" size={16} color={theme.colors.error} />
                                        </Pressable>
                                    </View>
                                </View>

                                {/* Courts List */}
                                <View style={styles.courtsSection}>
                                    <Text style={styles.courtsTitle}>Courts</Text>
                                    {facility.courts?.length === 0 ? (
                                        <Text style={styles.noCourtsText}>No courts added yet</Text>
                                    ) : (
                                        facility.courts?.map((court) => (
                                            <View key={court.id} style={styles.courtItem}>
                                                {court.image && (
                                                    <View style={styles.courtImageContainer}>
                                                        <Image 
                                                            source={{ uri: court.image }} 
                                                            style={styles.courtImage}
                                                            resizeMode="cover"
                                                        />
                                                    </View>
                                                )}
                                                
                                                <View style={styles.courtInfo}>
                                                    <Text style={styles.courtName}>{court.courtName}</Text>
                                                    <Text style={styles.courtType}>{court.courtType}</Text>
                                                    <Text style={styles.slotCount}>
                                                        {court.courtSlots?.length || 0} slots
                                                    </Text>
                                                </View>
                                                
                                                <View style={styles.courtActions}>
                                                    <Text style={styles.courtActionText}>
                                                        Use "Edit Facility" above to manage courts & slots
                                                    </Text>
                                                </View>
                                            </View>
                                        ))
                                    )}
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </ScreenWrapper>
    );
};

export default MyFacilities;

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
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.accent,
        paddingHorizontal: wp(6),
        paddingVertical: hp(2),
        borderRadius: theme.radius.lg,
    },
    createButtonText: {
        fontSize: theme.fontSizes.base,
        fontWeight: '600',
        color: 'white',
        marginLeft: wp(1),
    },
    facilitiesContainer: {
        paddingHorizontal: wp(4),
        paddingVertical: hp(3),
    },
    facilityCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        marginBottom: hp(3),
        borderWidth: 1,
        borderColor: theme.colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
        overflow: 'hidden',
    },
    facilityHeader: {
        flexDirection: 'row',
        padding: hp(3),
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    facilityImageContainer: {
        width: wp(20),
        height: wp(20),
        borderRadius: theme.radius.lg,
        overflow: 'hidden',
        marginRight: wp(3),
    },
    facilityImage: {
        width: '100%',
        height: '100%',
    },
    facilityInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    facilityName: {
        fontSize: theme.fontSizes.lg,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: hp(0.5),
    },
    facilityLocation: {
        fontSize: theme.fontSizes.sm,
        color: theme.colors.text.secondary,
        marginBottom: hp(0.5),
    },
    courtCount: {
        fontSize: theme.fontSizes.xs,
        color: theme.colors.accent,
        fontWeight: '500',
    },
    facilityActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(2),
    },
    editButton: {
        padding: hp(1),
        borderRadius: theme.radius.sm,
        backgroundColor: theme.colors.background,
    },
    deleteButton: {
        padding: hp(1),
        borderRadius: theme.radius.sm,
        backgroundColor: theme.colors.background,
    },
    courtsSection: {
        padding: hp(3),
    },
    courtsTitle: {
        fontSize: theme.fontSizes.base,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: hp(2),
    },
    noCourtsText: {
        fontSize: theme.fontSizes.sm,
        color: theme.colors.text.tertiary,
        fontStyle: 'italic',
    },
    courtItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: hp(2),
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    courtImageContainer: {
        width: wp(15),
        height: wp(15),
        borderRadius: theme.radius.sm,
        overflow: 'hidden',
        marginRight: wp(3),
    },
    courtImage: {
        width: '100%',
        height: '100%',
    },
    courtInfo: {
        flex: 1,
    },
    courtName: {
        fontSize: theme.fontSizes.base,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: hp(0.5),
    },
    courtType: {
        fontSize: theme.fontSizes.sm,
        color: theme.colors.text.secondary,
        marginBottom: hp(0.5),
    },
    slotCount: {
        fontSize: theme.fontSizes.xs,
        color: theme.colors.text.tertiary,
    },
    infoNote: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(2),
        backgroundColor: theme.colors.accent + '10',
        paddingHorizontal: wp(4),
        paddingVertical: hp(2),
        borderRadius: theme.radius.lg,
        marginBottom: hp(3),
        borderWidth: 1,
        borderColor: theme.colors.accent + '20',
    },
    infoNoteText: {
        fontSize: theme.fontSizes.sm,
        color: theme.colors.text.secondary,
        flex: 1,
        lineHeight: 20,
    },
    courtActions: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: wp(3),
        paddingVertical: hp(1),
        backgroundColor: theme.colors.background,
        borderRadius: theme.radius.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
        minWidth: wp(40),
    },
    courtActionText: {
        fontSize: theme.fontSizes.xs,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        fontStyle: 'italic',
    },
});
