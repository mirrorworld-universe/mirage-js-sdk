const generateRandomNFTMetadata = (address: string) => {
  function randomIntFromInterval(min: number = 1, max: number = 11000) {
    // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  const tokenId = randomIntFromInterval(1, 11000);

  return {
    name: `Mirror #${tokenId}`,
    symbol: 'MIRROR',
    collection: 'EMWv4qLVTLytXNheoWutoW1qFs6kP839GpZinK412GnS',
    description:
      'Mirrors is a collection of 11,000 unique AI Virtual Beings. Each Mirror can be upgraded and co-create narratives by talking with the collector, also offering a series of rights in the future games.\n',
    seller_fee_basis_points: 425,
    image: `https://storage.mirrorworld.fun/nft/${tokenId}.png`,
    attributes: [
      { trait_type: 'glasses', value: 'Bike Lens' },
      { trait_type: 'shoes', value: 'Fashion Sneakers, Purple' },
      { trait_type: 'pants', value: 'Beggar Pants, Green' },
      { trait_type: 'hat', value: 'None' },
      { trait_type: 'background', value: 'The Dance of Flies' },
      { trait_type: 'clothing', value: 'nabuC kraM Hoodie' },
      { trait_type: 'hair', value: 'nabuC kraM Hair' },
      { trait_type: 'bear', value: 'None' },
      { trait_type: 'skin', value: 'Blue' },
      { trait_type: 'soul', value: 'nabuC kraM' },
    ],
    external_url: '',
    properties: {
      files: [
        {
          uri: `https://storage.mirrorworld.fun/nft/${tokenId}.png`,
          type: 'unknown',
        },
      ],
      category: 'image',
      creators: [
        {
          address,
          verified: true,
          share: 95.75,
        },
      ],
    },
    animation_url: undefined,
  };
};
