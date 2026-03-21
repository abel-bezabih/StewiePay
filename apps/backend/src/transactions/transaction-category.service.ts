import { Injectable } from '@nestjs/common';

export type TransactionCategory =
  | 'Food & Drink'
  | 'Shopping'
  | 'Travel'
  | 'Entertainment'
  | 'Bills & Utilities'
  | 'Transportation'
  | 'Healthcare'
  | 'Education'
  | 'Gambling'
  | 'Other';

interface CategoryMapping {
  mcc: string[];
  merchantPatterns: RegExp[];
  category: TransactionCategory;
}

@Injectable()
export class TransactionCategoryService {
  private readonly categoryMappings: CategoryMapping[] = [
    {
      category: 'Food & Drink',
      mcc: ['5411', '5812', '5814', '5813', '5462', '5499'],
      merchantPatterns: [
        /starbucks/i,
        /mcdonald/i,
        /restaurant/i,
        /cafe/i,
        /coffee/i,
        /pizza/i,
        /burger/i,
        /food/i,
        /dining/i,
        /bar/i,
        /pub/i,
        /grill/i
      ]
    },
    {
      category: 'Shopping',
      mcc: ['5311', '5310', '5331', '5399', '5611', '5621', '5631', '5641', '5651', '5661', '5691', '5699', '5940', '5941', '5942', '5943', '5944', '5945', '5946', '5947', '5948', '5949', '5950', '5970', '5971', '5972', '5973', '5975', '5976', '5977', '5978', '5983', '5992', '5993', '5994', '5995', '5996', '5997', '5998', '5999'],
      merchantPatterns: [
        /amazon/i,
        /target/i,
        /walmart/i,
        /shop/i,
        /store/i,
        /retail/i,
        /mall/i,
        /market/i,
        /boutique/i,
        /clothing/i,
        /apparel/i
      ]
    },
    {
      category: 'Travel',
      mcc: ['3000', '3001', '3002', '3003', '3004', '3005', '3006', '3007', '3008', '3009', '3010', '3011', '3012', '3013', '3014', '3015', '3016', '3017', '3018', '3019', '3020', '3021', '3022', '3023', '3024', '3025', '3026', '3027', '3028', '3029', '3030', '3031', '3032', '3033', '3034', '3035', '3036', '3037', '3038', '3039', '3040', '3041', '3042', '3043', '3044', '3045', '3046', '3047', '3048', '3049', '3050', '3051', '3052', '3053', '3054', '3055', '3056', '3057', '3058', '3059', '3060', '3061', '3062', '3063', '3064', '3065', '3066', '3067', '3068', '3069', '3070', '3071', '3072', '3073', '3074', '3075', '3076', '3077', '3078', '3079', '3080', '3081', '3082', '3083', '3084', '3085', '3086', '3087', '3088', '3089', '3090', '3091', '3092', '3093', '3094', '3095', '3096', '3097', '3098', '3099', '3100', '3101', '3102', '3103', '3104', '3105', '3106', '3107', '3108', '3109', '3110', '3111', '3112', '3113', '3114', '3115', '3116', '3117', '3118', '3119', '3120', '3121', '3122', '3123', '3124', '3125', '3126', '3127', '3128', '3129', '3130', '3131', '3132', '3133', '3134', '3135', '3136', '3137', '3138', '3139', '3140', '3141', '3142', '3143', '3144', '3145', '3146', '3147', '3148', '3149', '3150', '3151', '3152', '3153', '3154', '3155', '3156', '3157', '3158', '3159', '3160', '3161', '3162', '3163', '3164', '3165', '3166', '3167', '3168', '3169', '3170', '3171', '3172', '3173', '3174', '3175', '3176', '3177', '3178', '3179', '3180', '3181', '3182', '3183', '3184', '3185', '3186', '3187', '3188', '3189', '3190', '3191', '3192', '3193', '3194', '3195', '3196', '3197', '3198', '3199', '5541', '5542'],
      merchantPatterns: [
        /airline/i,
        /hotel/i,
        /motel/i,
        /travel/i,
        /booking/i,
        /expedia/i,
        /airbnb/i,
        /uber/i,
        /lyft/i,
        /taxi/i,
        /gas/i,
        /fuel/i,
        /station/i
      ]
    },
    {
      category: 'Entertainment',
      mcc: ['7832', '7841', '7911', '7922', '7929', '7932', '7933', '7941', '7991', '7992', '7993', '7994', '7995', '7996', '7997', '7998', '7999'],
      merchantPatterns: [
        /movie/i,
        /cinema/i,
        /theater/i,
        /netflix/i,
        /spotify/i,
        /entertainment/i,
        /game/i,
        /arcade/i,
        /casino/i,
        /betting/i,
        /gambling/i
      ]
    },
    {
      category: 'Bills & Utilities',
      mcc: ['4814', '4816', '4900', '4901', '4902', '4903', '4904', '4905', '4906', '4907', '4908', '4909', '4910', '4911', '4912', '4913', '4914', '4915', '4916', '4917', '4918', '4919', '4920', '4921', '4922', '4923', '4924', '4925', '4926', '4927', '4928', '4929', '4930', '4931', '4932', '4933', '4934', '4935', '4936', '4937', '4938', '4939', '4940', '4941', '4942', '4943', '4944', '4945', '4946', '4947', '4948', '4949', '4950', '4951', '4952', '4953', '4954', '4955', '4956', '4957', '4958', '4959', '4960', '4961', '4962', '4963', '4964', '4965', '4966', '4967', '4968', '4969', '4970', '4971', '4972', '4973', '4974', '4975', '4976', '4977', '4978', '4979', '4980', '4981', '4982', '4983', '4984', '4985', '4986', '4987', '4988', '4989', '4990', '4991', '4992', '4993', '4994', '4995', '4996', '4997', '4998', '4999'],
      merchantPatterns: [
        /electric/i,
        /water/i,
        /gas company/i,
        /utility/i,
        /phone/i,
        /internet/i,
        /cable/i,
        /tv service/i,
        /bill/i
      ]
    },
    {
      category: 'Transportation',
      mcc: ['4111', '4112', '4121', '4131', '4511', '4784'],
      merchantPatterns: [
        /bus/i,
        /train/i,
        /metro/i,
        /subway/i,
        /transit/i,
        /parking/i,
        /toll/i
      ]
    },
    {
      category: 'Healthcare',
      mcc: ['5912', '5975', '5976', '8011', '8021', '8031', '8041', '8042', '8043', '8044', '8049', '8050', '8062', '8071', '8099'],
      merchantPatterns: [
        /pharmacy/i,
        /drug store/i,
        /medical/i,
        /hospital/i,
        /clinic/i,
        /doctor/i,
        /dentist/i,
        /health/i,
        /cvs/i,
        /walgreens/i
      ]
    },
    {
      category: 'Education',
      mcc: ['5192', '5193', '5942', '5943', '5970', '5971', '5972', '5973', '8211', '8220', '8241', '8244', '8249', '8299'],
      merchantPatterns: [
        /school/i,
        /university/i,
        /college/i,
        /education/i,
        /tuition/i,
        /course/i,
        /bookstore/i
      ]
    },
    {
      category: 'Gambling',
      mcc: ['7995'],
      merchantPatterns: [
        /casino/i,
        /betting/i,
        /gambling/i,
        /poker/i,
        /lottery/i
      ]
    }
  ];

  /**
   * Categorize a transaction based on MCC code and merchant name
   */
  categorize(merchantName: string, mcc?: string | null): TransactionCategory {
    const normalizedMerchant = merchantName.toLowerCase().trim();

    // First, try MCC code matching (most reliable)
    if (mcc) {
      for (const mapping of this.categoryMappings) {
        if (mapping.mcc.includes(mcc)) {
          return mapping.category;
        }
      }
    }

    // Then, try merchant name pattern matching
    for (const mapping of this.categoryMappings) {
      for (const pattern of mapping.merchantPatterns) {
        if (pattern.test(normalizedMerchant)) {
          return mapping.category;
        }
      }
    }

    // Default to "Other" if no match found
    return 'Other';
  }

  /**
   * Get all available categories
   */
  getCategories(): TransactionCategory[] {
    return [
      'Food & Drink',
      'Shopping',
      'Travel',
      'Entertainment',
      'Bills & Utilities',
      'Transportation',
      'Healthcare',
      'Education',
      'Gambling',
      'Other'
    ];
  }

  /**
   * Get category icon (for frontend)
   */
  getCategoryIcon(category: TransactionCategory): string {
    const icons: Record<TransactionCategory, string> = {
      'Food & Drink': '🍔',
      'Shopping': '🛍️',
      'Travel': '✈️',
      'Entertainment': '🎬',
      'Bills & Utilities': '💡',
      'Transportation': '🚗',
      'Healthcare': '🏥',
      'Education': '📚',
      'Gambling': '🎰',
      'Other': '📦'
    };
    return icons[category] || '📦';
  }

  /**
   * Get category color (for frontend)
   */
  getCategoryColor(category: TransactionCategory): string {
    const colors: Record<TransactionCategory, string> = {
      'Food & Drink': '#F59E0B',
      'Shopping': '#8B5CF6',
      'Travel': '#3B82F6',
      'Entertainment': '#EC4899',
      'Bills & Utilities': '#10B981',
      'Transportation': '#6366F1',
      'Healthcare': '#EF4444',
      'Education': '#06B6D4',
      'Gambling': '#F97316',
      'Other': '#6B7280'
    };
    return colors[category] || '#6B7280';
  }
}















