import Header from "@/components/Header";
import ScreenWrapper from "@/components/ScreenWrapper";
import { theme } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { hp, wp } from "@/helpers/common";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Image,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View
} from "react-native";

const Facility = () => {
    const { user } = useAuth();
    const router = useRouter();
    const { id } = useLocalSearchParams();
    
    const [facility, setFacility] = useState(null);
    const [courts, setCourts] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchFacilityData = async () => {
        try {
            const { data: facilityData, error: facilityError } = await supabase
                .from('facilities')
                .select('*')
                .eq('id', id)
                .single();

            if (facilityError) {
                console.error('Error fetching facility:', facilityError);
                Alert.alert("Error", "Failed to load facility");
                return;
            }

            setFacility(facilityData);

            const { data: courtsData, error: courtsError } = await supabase
                .from('courts')
                .select('*')
                .eq('facilityId', id);

            if (courtsError) {
                console.error('Error fetching courts:', courtsError);
            } else {
                setCourts(courtsData || []);
            }

        } catch (error) {
            console.error('Error:', error);
            Alert.alert("Error", "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchFacilityData();
        }
    }, [id]);

    const onCourtPress = (court) => {
        router.push({
            pathname: 'court',
            params: { 
                id: court.id,
                facilityId: facility.id
            }
        });
    };

    if (loading) {
        return (
            <ScreenWrapper bg="white">
                <StatusBar barStyle="dark-content" backgroundColor="white" />
                <Header title="Facility" />
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading facility...</Text>
                </View>
            </ScreenWrapper>
        );
    }

    if (!facility) {
        return (
            <ScreenWrapper bg="white">
                <StatusBar barStyle="dark-content" backgroundColor="white" />
                <Header title="Facility" />
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Facility not found</Text>
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper bg="white">
            <StatusBar barStyle="dark-content" backgroundColor="white" />
            
            <Header title={facility.name} />

            <ScrollView 
                style={styles.container}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.facilitySection}>
                    {facility.image && (
                        <View style={styles.facilityImageContainer}>
                            <Image 
                                source={{ uri: facility.image }} 
                                style={styles.facilityImage}
                                resizeMode="cover"
                            />
                        </View>
                    )}
                    
                    <View style={styles.facilityContent}>
                        <View style={styles.facilityHeader}>
                            <Ionicons name="business" size={32} color={theme.colors.accent} />
                            <Text style={styles.facilityName}>{facility.name}</Text>
                        </View>
                        
                        <View style={styles.facilityDetails}>
                            <View style={styles.detailRow}>
                                <Ionicons name="location" size={20} color="#666" />
                                <Text style={styles.detailText}>{facility.location}</Text>
                            </View>
                            
                            {facility.description && (
                                <View style={styles.descriptionContainer}>
                                    <Text style={styles.description}>{facility.description}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                <View style={styles.courtsSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Available Courts</Text>
                        <Text style={styles.courtCount}>{courts.length} courts</Text>
                    </View>
                    
                    {courts.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="tennisball-outline" size={48} color="#ccc" />
                            <Text style={styles.emptyText}>No courts available</Text>
                            <Text style={styles.emptySubtext}>Add courts to start booking slots</Text>
                            <Pressable style={styles.addCourtButton}>
                                <Ionicons name="add" size={20} color="white" />
                                <Text style={styles.addCourtText}>Add Court</Text>
                            </Pressable>
                        </View>
                    ) : (
                        <View style={styles.courtsGrid}>
                            {courts.map((court) => (
                                <Pressable
                                    key={court.id}
                                    style={styles.courtCard}
                                    onPress={() => onCourtPress(court)}
                                >
                                    {court.image && (
                                        <View style={styles.courtImageContainer}>
                                            <Image 
                                                source={{ uri: court.image }} 
                                                style={styles.courtImage}
                                                resizeMode="cover"
                                            />
                                        </View>
                                    )}
                                    
                                    <View style={styles.courtContent}>
                                        <View style={styles.courtHeader}>
                                            <Ionicons name="tennisball" size={24} color={theme.colors.success} />
                                            <Text style={styles.courtName}>{court.courtName}</Text>
                                        </View>
                                        
                                        <View style={styles.courtDetails}>
                                            <View style={styles.courtTypeContainer}>
                                                <Text style={styles.courtType}>{court.courtType}</Text>
                                            </View>
                                            <View style={styles.slotsInfo}>
                                                <Ionicons name="time-outline" size={16} color="#666" />
                                                <Text style={styles.slotsText}>Multiple time slots available</Text>
                                            </View>
                                        </View>
                                        
                                        <View style={styles.courtFooter}>
                                            <Text style={styles.bookNow}>View & Book Slots</Text>
                                            <Ionicons name="chevron-forward" size={16} color="#999" />
                                        </View>
                                    </View>
                                </Pressable>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
};

export default Facility;

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
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 16,
        color: '#666',
    },
    facilitySection: {
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    facilityImageContainer: {
        height: hp(20),
        width: '100%',
    },
    facilityImage: {
        width: '100%',
        height: '100%',
    },
    facilityContent: {
        paddingHorizontal: wp(4),
        paddingVertical: hp(3),
    },
    facilityHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp(2),
    },
    facilityName: {
        fontSize: theme.fontSizes['2xl'],
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginLeft: wp(2),
    },
    facilityDetails: {
        gap: hp(1),
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailText: {
        fontSize: theme.fontSizes.base,
        color: theme.colors.text.secondary,
        marginLeft: wp(2),
        flex: 1,
    },
    descriptionContainer: {
        marginTop: hp(1),
        paddingTop: hp(1),
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    description: {
        fontSize: theme.fontSizes.sm,
        color: theme.colors.text.secondary,
        lineHeight: 20,
    },
    courtsSection: {
        paddingHorizontal: wp(4),
        paddingVertical: hp(3),
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: hp(2),
    },
    sectionTitle: {
        fontSize: theme.fontSizes.xl,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    courtCount: {
        fontSize: theme.fontSizes.sm,
        color: theme.colors.text.secondary,
        backgroundColor: theme.colors.background,
        paddingHorizontal: wp(2),
        paddingVertical: hp(0.5),
        borderRadius: theme.radius.sm,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: hp(6),
    },
    emptyText: {
        fontSize: theme.fontSizes.lg,
        fontWeight: '600',
        color: '#666',
        marginTop: hp(2),
        marginBottom: hp(0.5),
    },
    emptySubtext: {
        fontSize: theme.fontSizes.sm,
        color: '#999',
        textAlign: 'center',
    },
    courtsGrid: {
        gap: hp(2),
    },
    courtCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
        overflow: 'hidden',
    },
    courtImageContainer: {
        height: hp(15),
        width: '100%',
    },
    courtImage: {
        width: '100%',
        height: '100%',
    },
    courtContent: {
        padding: hp(2.5),
    },
    courtHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp(1.5),
    },
    courtName: {
        fontSize: theme.fontSizes.lg,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginLeft: wp(2),
        flex: 1,
    },
    courtDetails: {
        marginBottom: hp(1.5),
    },
    courtTypeContainer: {
        alignSelf: 'flex-start',
    },
    courtType: {
        fontSize: theme.fontSizes.sm,
        color: theme.colors.text.secondary,
        backgroundColor: theme.colors.background,
        paddingHorizontal: wp(2),
        paddingVertical: hp(0.5),
        borderRadius: theme.radius.sm,
    },
    courtFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: hp(1),
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    bookNow: {
        fontSize: theme.fontSizes.sm,
        color: theme.colors.accent,
        fontWeight: '500',
    },
    slotsInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: hp(1),
    },
    slotsText: {
        fontSize: theme.fontSizes.xs,
        color: '#666',
        marginLeft: wp(1),
    },
    addCourtButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.accent,
        paddingHorizontal: wp(4),
        paddingVertical: hp(1.5),
        borderRadius: theme.radius.lg,
        marginTop: hp(3),
        alignSelf: 'center',
    },
    addCourtText: {
        fontSize: theme.fontSizes.base,
        fontWeight: '600',
        color: 'white',
        marginLeft: wp(1),
    },

});
