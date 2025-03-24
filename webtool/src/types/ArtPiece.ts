interface ArtPieceData {
    cft_values: string[];
    cftt_tree: Tree;
    creationearliestdate: number;
    creationfulldescription: string;
    creationlatestdate: number;
    creatorbirthanddeathdescription: string;
    creatorbirthdate: number;
    creatordeathdate: number;
    creatorfirstname: string;
    creatorfulldescription: string;
    creatorid: string;
    creatorlastname: string;
    creatornationality: string;
    formaldescriptiontermstylesperiods: string[];
    gsd_value: string;
    height: string;
    ift_values: string[];
    iftt_tree: Tree;
    ii_value: string;
    image_url: string;
    imagecolor: string;
    imagecopyright: string;
    imagetype: string;
    language: string;
    materials: string[];
    objectworktype: string[];
    physicalappearancedescription: string;
    ratio: string;
    recordid: number;
    signaturefulldescription: string;
    ssi_value: string;
    stf_values: string[];
    stt_tree: Tree;
    termclassification: string;
    title: string;
    width: string;
    workid: string;
    similarity?: number;
}

interface Tree {
    children: TreeChild[];
    name: string;
}

interface TreeChild {
    children: TreeChild[];
    name: string;
}

export default ArtPieceData;
export type { Tree, TreeChild };