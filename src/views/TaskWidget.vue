<template>
  <el-card class="box-card">
    <div class="card-header">
      <span>Total Proposed Price</span>
      <el-dropdown trigger="click">
        <span class="el-dropdown-link">
          <i class="el-icon-more"></i>
        </span>
        <el-dropdown-menu>
          <el-dropdown-item>Action 1</el-dropdown-item>
          <el-dropdown-item>Action 2</el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>
    <div class="card-content">
      <div class="card-number">4</div>
      <div class="card-description">Analyze Wuhan housing prices by combining POI data, OSM road data, and customer housing locations and values</div>
    </div>
  </el-card>
</template>

<script setup>
import { ElCard, ElDropdown, ElDropdownMenu, ElDropdownItem } from 'element-plus'
</script>

<style scoped>
.box-card {
  width: 225px;
  border: 1px solid #ebebeb;
  border-radius: 8px;
  padding: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 16px;
}

.card-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.card-number {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 8px;
}

.card-description {
  color: #666;
  font-size: 14px;
}
</style>
