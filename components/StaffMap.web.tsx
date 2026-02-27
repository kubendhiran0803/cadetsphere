import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface StaffMapProps {
    latitude: number;
    longitude: number;
    title: string;
    description: string;
}

const StaffMap = React.forwardRef((props: StaffMapProps, ref) => {
    return (
        <View style={styles.center}>
            <Text>Map view is not fully supported on web.</Text>
            <Text style={{ marginTop: 8 }}>Lat: {props.latitude}, Long: {props.longitude}</Text>
        </View>
    );
});

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
});

export default StaffMap;
