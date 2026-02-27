import React, { forwardRef } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

interface StaffMapProps {
    latitude: number;
    longitude: number;
    title: string;
    description: string;
}

const StaffMap = forwardRef<MapView, StaffMapProps>((props, ref) => {
    return (
        <MapView
            ref={ref}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
                latitude: props.latitude,
                longitude: props.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            }}
        >
            <Marker
                coordinate={{
                    latitude: props.latitude,
                    longitude: props.longitude,
                }}
                title={props.title}
                description={props.description}
            />
        </MapView>
    );
});

const styles = StyleSheet.create({
    map: {
        width: '100%',
        height: '100%',
    },
});

export default StaffMap;
