import type conventionalRecommendedBump from 'conventional-recommended-bump'

export type ReleaseType = conventionalRecommendedBump.Recommendation.ReleaseType | 'prerelease' | 'premajor' | 'preminor' | 'prepatch'
