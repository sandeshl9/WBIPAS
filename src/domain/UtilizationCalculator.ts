/**
 * DOMAIN LAYER - UtilizationCalculator
 * Pure business logic for utilization calculations
 */

export interface TeamUtilizationData {
  totalCapacity: number
  totalWorkload: number
  activeAssociates: number
}

export class UtilizationCalculator {
  /**
   * Calculate team-wide utilization percentage
   */
  static calculateTeamUtilization(data: TeamUtilizationData): number {
    if (data.totalCapacity === 0) return 0
    return Math.round((data.totalWorkload / data.totalCapacity) * 100 * 100) / 100
  }

  /**
   * Calculate average workload per associate
   */
  static calculateAverageWorkload(data: TeamUtilizationData): number {
    if (data.activeAssociates === 0) return 0
    return Math.round((data.totalWorkload / data.activeAssociates) * 100) / 100
  }

  /**
   * Calculate available capacity across team
   */
  static calculateAvailableCapacity(data: TeamUtilizationData): number {
    return Math.max(0, data.totalCapacity - data.totalWorkload)
  }

  /**
   * Get utilization health status
   */
  static getUtilizationHealth(utilizationPercentage: number): {
    status: 'low' | 'healthy' | 'high' | 'critical'
    color: string
    message: string
  } {
    if (utilizationPercentage < 50) {
      return {
        status: 'low',
        color: 'blue',
        message: 'Team has significant available capacity',
      }
    }
    
    if (utilizationPercentage < 80) {
      return {
        status: 'healthy',
        color: 'green',
        message: 'Team utilization is healthy',
      }
    }
    
    if (utilizationPercentage < 100) {
      return {
        status: 'high',
        color: 'yellow',
        message: 'Team is highly utilized',
      }
    }
    
    return {
      status: 'critical',
      color: 'red',
      message: 'Team is over capacity',
    }
  }

  /**
   * Calculate individual associate utilization percentage
   */
  static calculateUtilization(currentWorkload: number, capacity: number): number {
    if (capacity === 0) return 0
    return Math.round((currentWorkload / capacity) * 100 * 100) / 100
  }

  /**
   * Calculate average utilization across all associates
   */
  static calculateAverageUtilization(
    associates: Array<{ weekly_capacity: number }>,
    workloadData: Array<{ associateId: string; activeProjectCount?: number; openingBalanceCount?: number }>
  ): number {
    if (associates.length === 0) return 0

    const totalUtilization = associates.reduce((sum, associate, index) => {
      const workload = workloadData.find((w, i) => i === index)
      const currentWorkload = 
        (workload?.activeProjectCount || 0) + (workload?.openingBalanceCount || 0)
      const utilization = this.calculateUtilization(currentWorkload, associate.weekly_capacity)
      return sum + utilization
    }, 0)

    return Math.round((totalUtilization / associates.length) * 100) / 100
  }
}
