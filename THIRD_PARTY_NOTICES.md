# 第三方素材及署名

本文件整理自已发布页面、原有素材清单和全景制作来源说明，保留原许可，不对第三方作品额外授予权利。未将工作目录中的其他模型、原始场景或下载包加入仓库。

## JavaScript

Three.js 0.180.0（MIT）及 esbuild 0.25.10（MIT）通过 npm 安装。构建产物保留 esbuild 生成的法律注释。完整文本见 `licenses/`。

## 两套实时 3D 网站中的模型（CC BY 4.0）

许可：https://creativecommons.org/licenses/by/4.0/

- `mirror-wardrobe.glb`：Mirror wardrobe 120cm shelf type，作者 interior model。https://sketchfab.com/3d-models/mirror-wardrobe-120cm-shelf-type-3b93d59441514f0daed4c915dc66c62f 。场景中调整尺寸、复制与摆放。
- `grey-sectional-sofa.glb`：Gray L-Shaped Couch，作者 AleixoAlonso。https://sketchfab.com/3d-models/gray-l-shaped-couch-f3a71dc05afb46f8a2fae64eba0acc64 。下载为带 1K 内嵌贴图的 GLB；场景中缩放与摆放。
- `modern-bed.glb`：Modern Bed，作者 Ngngan。https://sketchfab.com/3d-models/modern-bed-c713701eecbd479ea5ae7918de5de2f2 。下载为带 1K 内嵌贴图的 GLB；场景中缩放与摆放。

二次修改/再分发时保留标题、作者、来源和许可链接，并说明新增修改。原 `csw/dist/assets/ATTRIBUTION.*` 提及的 Mid Century Modern Sofa 不在本交付中，网站未引用它。

## CC0 模型、贴图和环境图

Poly Haven 许可：https://polyhaven.com/license
ambientCG 许可：https://docs.ambientcg.com/license/
CC0：https://creativecommons.org/publicdomain/zero/1.0/

- Dining Chair 02，James Ray Cock：https://polyhaven.com/a/dining_chair_02
- Modern Coffee Table 01，Amin：https://polyhaven.com/a/modern_coffee_table_01
- Modern Arm Chair 01，Vibrant Nordic（csw）：https://polyhaven.com/a/modern_arm_chair_01
- White Stucco（txc 墙面）：https://polyhaven.com/a/white_stucco
- Marble 01（txc 地面）：https://polyhaven.com/a/marble_01
- Wood Floor（csw）：https://polyhaven.com/a/wood_floor
- Kloppenheim 06 Pure Sky（两套 sky.hdr）：https://polyhaven.com/a/kloppenheim_06_puresky
- Tiles105（txc）：https://ambientcg.com/view?id=Tiles105
- WoodFloor039（txc）：https://ambientcg.com/view?id=WoodFloor039

部分 GLTF 转换为自包含 GLB，部分图片作尺寸/格式转换，模型在场景中缩放与摆放。程序化几何与材质属于本项目实现。

## 客厅 360° 全景

原始署名、制作和授权记录完整保留在 `txc/dist/panorama/sources.txt`。全景成图是 6144×3072 渲染结果；不是房间实拍，也不能在房间内自由移动。

其中 iMeshh 的 Thick Piping Sofa 01、Oval Wood Coffee Table 01、Creased Duvet Double Bed 01 为 Royalty Free，而非 CC0。只含最终渲染图，**未含这些可提取源资产**。需要重新渲染时，向原提供方取得合法许可与模型：

- https://imeshh.com/assets/thick-piping-sofa-3d-model
- https://imeshh.com/assets/wooden-oval-table
- https://imeshh.com/assets/creased-fabric-bed-with-black-frame
- 条款：https://pro.imeshh.com/terms

其余全景使用的 Poly Haven、Blendkit、ambientCG 来源和作者见上述 `sources.txt`。本仓库不包含用于生成全景的 Blender 场景。

## 用户提供的图纸与照片

`plan-original.jpg`、`plan-areas.jpg`、`facade-reference.png` 为用户提供的输入/参考，保留原权利。本仓库按用户明确要求公开，图纸与照片仅保留原有权利，不因此授予额外转授权或开放许可证。第三方再利用前应自行确认权限；不得移除第三方素材署名。
