import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { subscribeToContributions } from '../src/services/contributionService';
import { subscribeToConfig } from '../src/services/configService';
import { Contribution } from '../src/types';

export default function GridScreen() {
  const router = useRouter();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [challengeSize, setChallengeSize] = useState(100);

  useEffect(() => {
    const unsubscribeContributions = subscribeToContributions((data) => {
      setContributions(data);
      setLoading(false);
    });
    
    const unsubscribeConfig = subscribeToConfig((config) => {
      setChallengeSize(config.challengeSize);
    });
    
    return () => {
      unsubscribeContributions();
      unsubscribeConfig();
    };
  }, []);

  const getNumberStatus = (num: number) => {
    const contribution = contributions.find((c: Contribution) => c.number === num);
    return contribution ? contribution.status : 'available';
  };

  const handleNumberPress = (num: number) => {
    const status = getNumberStatus(num);
    if (status !== 'available') {
      Alert.alert('Indisponível', 'Este número já foi escolhido.');
      return;
    }
    router.push({ pathname: '/confirm', params: { number: num } });
  };

  const renderItem = ({ item }: { item: number }) => {
    const status = getNumberStatus(item);
    let backgroundColor = '#4CAF50'; // Available - Green
    if (status === 'pending') backgroundColor = '#FFC107'; // Pending - Yellow
    if (status === 'confirmed') backgroundColor = '#F44336'; // Confirmed - Red

    return (
      <TouchableOpacity
        style={[styles.gridItem, { backgroundColor }]}
        onPress={() => handleNumberPress(item)}
      >
        <Text style={styles.gridText}>{item}</Text>
      </TouchableOpacity>
    );
  };

  const numbers = Array.from({ length: challengeSize }, (_, i) => i + 1);

  // Calculate progress
  const confirmedCount = contributions.filter((c: Contribution) => c.status === 'confirmed').length;
  const progress = confirmedCount / challengeSize;

  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>Progresso: {confirmedCount}/{challengeSize}</Text>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      <FlatList
        data={numbers}
        renderItem={renderItem}
        keyExtractor={(item: number) => item.toString()}
        numColumns={5}
        contentContainerStyle={styles.gridContainer}
      />
      
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
          <Text>Disponível</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#FFC107' }]} />
          <Text>Pendente</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#F44336' }]} />
          <Text>Confirmado</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#fff',
  },
  progressContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  progressText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  progressBarBackground: {
    width: '100%',
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  gridContainer: {
    paddingBottom: 20,
  },
  gridItem: {
    flex: 1,
    margin: 5,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  gridText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 20,
    height: 20,
    borderRadius: 5,
    marginRight: 5,
  },
});
